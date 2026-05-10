import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { T } from '../../constants/theme';
import { parseReceipt, ParsedItem } from '../../services/mockApi';
import { createItems, ApiError } from '../../services/api';
import { ConfirmItemList } from '../../components/ConfirmItemList';
import { CameraIcon, SparkleIcon } from '../../components/Icons';

type ScreenState = 'capture' | 'viewfinder' | 'loading' | 'confirm';

function daysToDate(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
}

export default function AddScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>('capture');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [parseNotes, setParseNotes] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  async function handleZoneTap() {
    setCaptureError(null);
    if (!permission) return;
    if (!permission.granted) {
      if (permission.canAskAgain) {
        await requestPermission();
      } else {
        Linking.openSettings();
      }
      return;
    }
    setPendingUri(null);
    setState('viewfinder');
  }

  async function handleShutter() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setPendingUri(photo.uri);
    } catch {
      setState('capture');
      setCaptureError("Couldn't capture photo — try again");
    }
  }

  function handleRetake() {
    setPendingUri(null);
  }

  function handleUsePhoto() {
    setPhotoUri(pendingUri);
    setPendingUri(null);
    setState('capture');
  }

  async function handleAnalyze() {
    setState('loading');
    const result = await parseReceipt('mock');
    setParsedItems(result.items);
    setParseNotes(result.parse_notes);
    setState('confirm');
  }

  async function handleConfirm(items: ParsedItem[]) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await createItems(
        items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          purchase_date: today,
          predicted_expiry: daysToDate(item.predicted_expiry_days),
        }))
      );
      setPhotoUri(null);
      setState('capture');
      router.push('/(tabs)');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace('/onboarding');
      } else {
        setCaptureError("Couldn't save items — check your connection");
        setState('capture');
      }
    }
  }

  if (state === 'confirm') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.cream }}>
        <ConfirmItemList
          items={parsedItems}
          parseNotes={parseNotes}
          onConfirm={handleConfirm}
          onCancel={() => setState('capture')}
        />
      </SafeAreaView>
    );
  }

  const permissionDenied = permission && !permission.granted;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Add Groceries</Text>
        <Text style={s.subtitle}>Snap your cart or receipt to import</Text>
      </View>

      <TouchableOpacity onPress={handleZoneTap} activeOpacity={0.85}>
        <View style={s.cameraZone}>
          {[
            { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
            { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
            { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
            { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
          ].map((style, i) => (
            <View key={i} style={[s.bracket, style as object, { borderColor: T.green400 }]} />
          ))}

          {permissionDenied ? (
            <>
              <View style={s.cameraIconWrap}>
                <CameraIcon size={26} color="rgba(255,255,255,0.5)" />
              </View>
              <Text style={s.cameraLabel}>Tap to allow camera access</Text>
              <Text style={s.cameraHint}>required to take photos</Text>
            </>
          ) : photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={s.retakePill}>
                <Text style={s.retakePillText}>Retake</Text>
              </View>
            </>
          ) : (
            <>
              <View style={s.cameraIconWrap}>
                <CameraIcon size={26} color="rgba(255,255,255,0.7)" />
              </View>
              <Text style={s.cameraLabel}>Take a photo</Text>
              <Text style={s.cameraHint}>cart · receipt · shelf label</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.analyzeBtn, (!photoUri || state === 'loading') && s.analyzeBtnDisabled]}
        onPress={handleAnalyze}
        activeOpacity={0.8}
        disabled={!photoUri || state === 'loading'}
      >
        <SparkleIcon size={15} color={T.white} />
        <Text style={s.analyzeBtnText}>
          {state === 'loading' ? 'Analyzing…' : 'Analyze Photo'}
        </Text>
      </TouchableOpacity>

      {captureError ? <Text style={s.errorText}>{captureError}</Text> : null}

      {state === 'viewfinder' && (
        <View style={s.viewfinder}>
          {pendingUri ? (
            <>
              <Image source={{ uri: pendingUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={s.previewButtons}>
                <TouchableOpacity style={s.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                  <Text style={s.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.usePhotoBtn} onPress={handleUsePhoto} activeOpacity={0.8}>
                  <Text style={s.usePhotoBtnText}>Use Photo</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setState('capture')}
                hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
              >
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shutterBtn} onPress={handleShutter} activeOpacity={0.7} />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  header: { padding: 20, paddingTop: 8 },
  title: {
    fontSize: 26, fontWeight: '700', color: T.ink,
    fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  cameraZone: {
    marginHorizontal: 20,
    height: 200,
    backgroundColor: T.green900,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  bracket: { position: 'absolute', width: 20, height: 20 },
  cameraIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraLabel: { color: T.white, fontSize: 15, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  cameraHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'DMSans_400Regular' },
  retakePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  retakePillText: { color: T.white, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  analyzeBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: T.green700,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: T.white, fontSize: 16, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  errorText: {
    marginHorizontal: 20,
    marginTop: 8,
    fontSize: 13,
    color: T.coral,
    fontFamily: 'DMSans_400Regular',
  },
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: T.white, fontSize: 18 },
  shutterBtn: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.white,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  previewButtons: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.white,
    alignItems: 'center',
  },
  retakeBtnText: { color: T.white, fontSize: 15, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  usePhotoBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: T.green700,
    alignItems: 'center',
  },
  usePhotoBtnText: { color: T.white, fontSize: 15, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
});
