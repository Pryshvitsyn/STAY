import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const backgroundEffect = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;

float hash21(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + float2(1.0, 0.0));
  float c = hash21(i + float2(0.0, 1.0));
  float d = hash21(i + float2(1.0, 1.0));
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(float2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += noise2(p) * a;
    p = p * 2.03 + 13.7;
    a *= 0.5;
  }
  return v;
}

half4 main(float2 xy) {
  float2 uv = xy / resolution;
  float aspect = resolution.x / resolution.y;
  float2 p = uv - float2(0.5, 0.45);
  p.x *= aspect;

  float d = length(p);
  float radial = 1.0 - smoothstep(0.04, 0.82, d);
  float cloud = fbm(float2(uv.x * 2.2 + time * 0.008, uv.y * 2.5 - time * 0.006));

  float3 edgeColor = float3(0.002, 0.008, 0.025);
  float3 centerColor = float3(0.018, 0.20, 0.42);
  float3 color = mix(edgeColor, centerColor, radial);
  color += float3(0.00, 0.045, 0.11) * cloud * radial * 0.58;
  color *= 0.98 + sin(time * 0.10) * 0.02;

  return half4(color, 1.0);
}
`);

const sphereEffect = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;
uniform float intensity;

float hash21(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + float2(1.0, 0.0));
  float c = hash21(i + float2(0.0, 1.0));
  float d = hash21(i + float2(1.0, 1.0));
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(float2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  for (int i = 0; i < 6; i++) {
    value += noise2(p) * amplitude;
    p = float2(
      p.x * 1.83 - p.y * 1.11,
      p.x * 1.11 + p.y * 1.83
    ) + 9.7;
    amplitude *= 0.5;
  }
  return value;
}

float2 rotate2(float2 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return float2(c * p.x - s * p.y, s * p.x + c * p.y);
}

half4 main(float2 xy) {
  float2 center = resolution * 0.5;
  float minDim = min(resolution.x, resolution.y);
  float2 p = (xy - center) / minDim;

  float breath = 1.0 + sin(time * 0.53) * 0.008 + intensity * 0.010;
  float radius = 0.435 * breath;
  float rr = length(p) / radius;

  if (rr > 1.0) {
    float halo = exp(-(rr - 1.0) * 18.0);
    return half4(0.02, 0.22, 0.72, halo * 0.16);
  }

  float rSafe = clamp(rr, 0.0, 0.9999);
  float z = sqrt(max(0.0, 1.0 - rSafe * rSafe));

  float3 n = normalize(float3(p.x / radius, p.y / radius, z));

  float rotY = time * 0.075;
  float cy = cos(rotY);
  float sy = sin(rotY);

  float3 r;
  r.x = n.x * cy + n.z * sy;
  r.y = n.y;
  r.z = -n.x * sy + n.z * cy;

  float2 q = rotate2(r.xy, time * -0.042) * 2.45;

  float largeFlow = fbm(q * 0.90 + float2(time * 0.042, -time * 0.031));
  float warpX = fbm(q * 1.35 + float2(time * 0.075, 4.7));
  float warpY = fbm(q * 1.45 + float2(-3.4, -time * 0.061));

  float2 warped = q + float2(warpX - 0.5, warpY - 0.5) * (0.72 + intensity * 0.28);

  float detail = fbm(warped * 2.15 + float2(-time * 0.055, time * 0.083));
  float micro = fbm(warped * 4.70 + float2(time * 0.12, -time * 0.10));

  float3 deepBlue = float3(0.004, 0.012, 0.10);
  float3 electricBlue = float3(0.012, 0.17, 0.95);
  float3 cyan = float3(0.00, 0.82, 1.00);
  float3 violet = float3(0.44, 0.025, 0.94);
  float3 burgundy = float3(0.42, 0.004, 0.07);
  float3 magenta = float3(0.95, 0.012, 0.30);
  float3 whiteHot = float3(0.94, 0.97, 1.00);

  float coolField = smoothstep(0.34, 0.72, largeFlow + detail * 0.22);
  float warmField = smoothstep(
    0.45,
    0.72,
    fbm(rotate2(warped, 1.65) * 1.25 + float2(-time * 0.037, time * 0.028))
  );
  float violetField = smoothstep(0.38, 0.68, detail);
  float cyanField = smoothstep(0.52, 0.79, micro + coolField * 0.25);

  float3 color = mix(deepBlue, electricBlue, coolField);
  color = mix(color, violet, violetField * 0.70);
  color = mix(color, burgundy, warmField * 0.78);
  color = mix(color, magenta, warmField * detail * 0.55);
  color = mix(color, cyan, cyanField * 0.52);

  float e1 = fbm(warped * 3.10 + float2(time * 0.115, -time * 0.084));
  float contour1 = abs(sin((e1 * 6.8 + largeFlow * 1.9) * 3.14159265));
  float lightning1 = 1.0 - smoothstep(0.00, 0.090, contour1);

  float e2 = fbm(rotate2(warped, -0.76) * 4.15 + float2(-time * 0.082, time * 0.135));
  float contour2 = abs(sin((e2 * 8.2 + micro * 1.4) * 3.14159265));
  float lightning2 = 1.0 - smoothstep(0.00, 0.075, contour2);

  float lightning = clamp(
    lightning1 * (0.50 + intensity * 0.55) +
    lightning2 * intensity * 0.72,
    0.0,
    1.0
  );

  float3 coolLightning = mix(electricBlue, cyan, 0.78);
  float3 warmLightning = mix(burgundy, magenta, 0.88);
  float3 lightningColor = mix(coolLightning, warmLightning, warmField);
  lightningColor = mix(lightningColor, float3(0.58, 0.20, 1.0), violetField * 0.44);

  color += lightningColor * lightning * (0.90 + intensity * 1.10);
  color += whiteHot * pow(lightning, 3.2) * (0.60 + intensity * 0.72);

  float fresnel = pow(1.0 - z, 2.5);
  color += float3(0.05, 0.42, 1.00) * fresnel * 0.92;

  float3 lightDir = normalize(float3(-0.38, -0.55, 1.0));
  float spec = pow(max(dot(n, lightDir), 0.0), 42.0);
  color += whiteHot * spec * 0.72;

  color *= 0.76 + z * 0.34;
  color *= 0.94 + sin(time * 0.73) * (0.025 + intensity * 0.025);
  color *= 0.92 + intensity * 0.28;

  float alpha = 1.0 - smoothstep(0.985, 1.0, rr);
  alpha = max(alpha, fresnel * 0.68);

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
    const intensity = 0.34 + eased * 0.55 + slowWave * 0.10;

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
  const sphereSize = useMemo(() => Math.min(SCREEN_WIDTH * 0.97, 470), []);

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
  screen: {
    flex: 1,
    backgroundColor: '#020711',
  },
  content: {
    flex: 1,
    paddingTop: 68,
  },
  header: {
    alignItems: 'center',
  },
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
