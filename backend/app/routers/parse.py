import json

from fastapi import APIRouter, Depends, HTTPException
from openai import APIError, OpenAI, RateLimitError

from app.auth import get_current_user
from app.models import User
from app.schemas import ParseReceiptRequest, ParseReceiptResponse

router = APIRouter()
client = OpenAI()  # reads OPENAI_API_KEY from environment

SYSTEM_PROMPT = """You are a grocery receipt parser. Given a receipt image, extract all food and grocery items.

For each item return:
- name: clean item name (e.g. "Strawberries", "Chicken Breast")
- quantity: amount and unit if visible (e.g. "1 pint", "2 lbs"), null if not shown
- predicted_expiry_days: estimated days until expiry when refrigerated, based on typical shelf life
- confidence: "high" if item name is clearly readable, "medium" if partially readable, "low" if inferred

Return JSON only — no prose:
{
  "items": [...],
  "parse_notes": null
}"""


@router.post("/receipt", response_model=ParseReceiptResponse)
def parse_receipt(
    body: ParseReceiptRequest,
    current_user: User = Depends(get_current_user),
):
    if not body.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")
    if len(body.image_base64) > 500_000:
        raise HTTPException(status_code=413, detail="Image too large — resize before uploading")

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{body.image_base64}"
                            },
                        }
                    ],
                },
            ],
        )
        raw = response.choices[0].message.content
        data = json.loads(raw)
        return ParseReceiptResponse(**data)
    except RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit — try again shortly")
    except APIError:
        raise HTTPException(
            status_code=502, detail="Couldn't parse receipt — try again"
        )
    except (json.JSONDecodeError, ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Unexpected response from AI")
