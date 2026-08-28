import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const backgroundEffect = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;

half4 main(float2 xy) {
  float2 uv = xy / resolution;
  float aspect = resolution.x / resolution.y;
  float2 p = uv - float2(0.5, 0.46);
  p.x *= aspect;
  float d = length(p);
  float radial = 1.0 - smoothstep(0.04, 0.82, d);
  float pulse = 0.98 + sin(time * 0.12) * 0.02;
  float3 edge = float3(0.003, 0.008, 0.025);
  float3 center = float3(0.02, 0.20, 0.43);
  float3 color = mix(edge, center, radial) * pulse;
  return half4(color, 1.0);
}
`);

const sphereEffect = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;
uniform float intensity;

float2 rot(float2 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return float2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float field(float2 p, float t) {
  float v = 0.0;
  v += sin(p.x * 4.1 + t * 0.42);
  v += sin(p.y * 5.3 - t * 0.31);
  v += sin((p.x + p.y) * 3.7 + t * 0.23);
  v += sin(length(p) * 9.0 - t * 0.55);
  return v * 0.25;
}

half4 main(float2 xy) {
  float2 center = resolution * 0.5;
  float minDim = min(resolution.x, resolution.y);
  float2 p = (xy - center) / minDim;

  float breath = 1.0 + sin(time * 0.52) * 0.008 + intensity * 0.008;
  float radius = 0.435 * breath;
  float rr = length(p) / radius;

  if (rr > 1.0) {
    float halo = exp(-(rr - 1.0) * 20.0);
    return half4(0.03, 0.24, 0.72, halo * 0.14);
  }

  float z = sqrt(max(0.0, 1.0 - rr * rr));
  float3 n = normalize(float3(p.x / radius, p.y / radius, z));

  float angle = time * 0.11;
  float ca = cos(angle);
  float sa = sin(angle);
  float3 r = float3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);

  float2 q = rot(r.xy * 2.2, -time * 0.05);
  float f1 = field(q, time);
  float f2 = field(rot(q * 1.35, 1.2), time * 1.16 + 2.0);
  float f3 = field(rot(q * 1.75, -0.8), -time * 0.86 + 5.0);

  float cool = smoothstep(-0.25, 0.55, f1 + f2 * 0.45);
  float warm = smoothstep(-0.10, 0.60, f2 - f3 * 0.35);
  float violetField = smoothstep(-0.30, 0.50, f3 + f1 * 0.25);

  float3 deepBlue = float3(0.004, 0.012, 0.10);
  float3 electricBlue = float3(0.015, 0.18, 0.95);
  float3 cyan = float3(0.00, 0.82, 1.00);
  float3 violet = float3(0.44, 0.03, 0.92);
  float3 burgundy = float3(0.42, 0.004, 0.07);
  float3 magenta = float3(0.92, 0.02, 0.30);
  float3 whiteHot = float3(0.95, 0.98, 1.0);

  float3 color = mix(deepBlue, electricBlue, cool);
  color = mix(color, violet, violetField * 0.68);
  color = mix(color, burgundy, warm * 0.72);
  color = mix(color, magenta, warm * violetField * 0.45);
  color = mix(color, cyan, smoothstep(0.15, 0.78, f1 + f3 * 0.30) * 0.40);

  float lightningA = 1.0 - smoothstep(0.00, 0.10, abs(sin((f1 * 5.0 + f2 * 2.0) * 3.14159265)));
  float lightningB = 1.0 - smoothstep(0.00, 0.075, abs(sin((f3 * 7.0 - f2 * 1.7 + time * 0.08) * 3.14159265)));
  float lightning = clamp(lightningA * (0.45 + intensity * 0.45) + lightningB * intensity * 0.55, 0.0, 1.0);

  float3 lightningColor = mix(cyan, magenta, warm);
  lightningColor = mix(lightningColor, violet, violetField * 0.38);
  color += lightningColor * lightning * (0.65 + intensity * 0.75);
  color += whiteHot * pow(lightning, 3.0) * (0.32 + intensity * 0.42);

  float fresnel = pow(1.0 - z, 2.4);
  color += float3(0.04, 0.38, 1.0) * fresnel * 0.78;

  float3 lightDir = normalize(float3(-0.35, -0.55, 1.0));
  float spec = pow(max(dot(n, lightDir), 0.0), 34.0);
  color += whiteHot * spec * 0.52;

  color *= 0.78 + z * 0.30;
  color *= 0.95 + sin(time * 0.72) * (0.02 + intensity * 0.018);
  color *= 0.94 + intensity * 0.16;

  float alpha = 1.0 - smoothstep(0.985, 1.0, rr);
  alpha = max(alpha, fresnel * 0.60);
  return half4(color, clamp(alpha, 0.0, 1.0));
}
`);

if (!backgroundEffect || !sphereEffect) {
  throw new Error('STAY shader compilation failed');
}

function LivingBackground() {
  const clock = useClock();
  const uniforms = useDerivedValue(() => ({
    resolution: [SCREEN_WIDTH, SCREEN_HEIGHT],
    time: clock.value / 1000,
  }));

  return (
    <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Fill>
        <Shader source={backgroundEffect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

function EmotionalSphere({ size }: { size: number }) {
  const clock = useClock();

  const uniforms = useDerivedValue(() => {
    const seconds = clock.value / 1000;
    const progress = Math.min(1, seconds / 18);
    const eased = progress * progress * (3 - 2 * progress);
    const slowWave = 0.5 + 0.5 * Math.sin(seconds * 0.19);
    const intensity = 0.32 + eased * 0.52 + slowWave * 0.08;

    return {
      resolution: [size, size],
      time: seconds,
      intensity,
    };
  }, [size]);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Fill>
        <Shader source={sphereEffect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

export default function HomeScreen() {
  const sphereSize = useMemo(() => Math.min(SCREEN_WIDTH * 0.94, 440), []);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LivingBackground />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>STAY</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>2 / 5 today</Text>
        </View>

        <View style={styles.sphereZone}>
          <EmotionalSphere size={sphereSize} />
        </View>

        <View style={styles.bottom}>
          <Text style={styles.tagline}>Train the pause before the reaction.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start Training"
            style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}>
            <Text style={styles.startText}>Start Training</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020711' },
  content: { flex: 1, paddingTop: 68 },
  header: { alignItems: 'center' },
  logo: {
    color: 'rgba(255,255,255,0.96)',
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: 13,
    marginLeft: 13,
  },
  progressTrack: {
    width: 180,
    height: 3,
    marginTop: 27,
    borderRadius: 100,
    backgroundColor: 'rgba(55,135,205,0.22)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: '#53D9FF',
  },
  progressText: {
    color: 'rgba(190,220,248,0.76)',
    fontSize: 16,
    letterSpacing: 2,
    marginTop: 14,
    fontWeight: '300',
  },
  sphereZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  bottom: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 34,
  },
  tagline: {
    color: 'rgba(201,222,245,0.73)',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 1.1,
    textAlign: 'center',
    marginBottom: 34,
  },
  startButton: {
    width: '100%',
    height: 76,
    borderRadius: 38,
    borderWidth: 1.2,
    borderColor: 'rgba(100,170,255,0.82)',
    backgroundColor: 'rgba(5,22,55,0.56)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 27,
    shadowColor: '#56A8FF',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  startButtonPressed: {
    transform: [{ scale: 0.985 }],
    backgroundColor: 'rgba(20,60,110,0.66)',
  },
  startText: {
    color: '#F5FAFF',
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 2.3,
  },
  arrow: {
    position: 'absolute',
    right: 28,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 31,
    fontWeight: '200',
  },
});
