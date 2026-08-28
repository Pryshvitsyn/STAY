import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPHERE_ART = require('@/assets/images/stay-sphere-reference.webp');

function useLoopingRotation(duration: number, reverse = false) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [duration, value]);

  return value.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });
}

function LivingReferenceSphere({ size }: { size: number }) {
  const slowRotation = useLoopingRotation(160000, false);
  const innerRotation = useLoopingRotation(52000, true);
  const innerRotationTwo = useLoopingRotation(83000, false);

  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [glow, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.997, 1.014],
  });

  const innerScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1.06, 1.14],
  });

  const overlayOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.09, 0.20],
  });

  const secondOverlayOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.12],
  });

  const haloOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.20, 0.38],
  });

  const innerSize = size * 0.74;

  return (
    <View style={[styles.sphereWrap, { width: size, height: size }]}> 
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: size,
            opacity: haloOpacity,
          },
        ]}
      />

      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ scale }, { rotate: slowRotation }],
        }}>
        <Image
          source={SPHERE_ART}
          contentFit="contain"
          transition={0}
          style={{ width: size, height: size }}
        />
      </Animated.View>

      <View
        pointerEvents="none"
        style={[
          styles.innerMask,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}>
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            left: -(size - innerSize) / 2,
            top: -(size - innerSize) / 2,
            opacity: overlayOpacity,
            transform: [{ scale: innerScale }, { rotate: innerRotation }],
          }}>
          <Image
            source={SPHERE_ART}
            contentFit="contain"
            transition={0}
            style={{ width: size, height: size }}
          />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            left: -(size - innerSize) / 2,
            top: -(size - innerSize) / 2,
            opacity: secondOverlayOpacity,
            transform: [{ scale: 1.16 }, { rotate: innerRotationTwo }],
          }}>
          <Image
            source={SPHERE_ART}
            contentFit="contain"
            transition={0}
            style={{ width: size, height: size }}
          />
        </Animated.View>
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.glassRim,
          {
            width: size * 0.91,
            height: size * 0.91,
            borderRadius: size,
          },
        ]}
      />
    </View>
  );
}

export default function HomeScreen() {
  const sphereSize = useMemo(() => Math.min(SCREEN_WIDTH * 0.94, 430), []);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.backgroundGlow} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>STAY</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.progressText}>2 / 5 today</Text>
        </View>

        <View style={styles.sphereZone}>
          <LivingReferenceSphere size={sphereSize} />
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
    backgroundColor: '#01050d',
    overflow: 'hidden',
  },
  backgroundGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.6,
    height: SCREEN_WIDTH * 1.6,
    borderRadius: SCREEN_WIDTH,
    left: -SCREEN_WIDTH * 0.3,
    top: '18%',
    backgroundColor: 'rgba(0, 91, 193, 0.22)',
    shadowColor: '#087dff',
    shadowOpacity: 0.34,
    shadowRadius: 110,
    shadowOffset: { width: 0, height: 0 },
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
    marginTop: -2,
  },
  sphereWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 105, 255, 0.36)',
    shadowColor: '#1f8cff',
    shadowOpacity: 0.9,
    shadowRadius: 64,
    shadowOffset: { width: 0, height: 0 },
  },
  innerMask: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassRim: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(159, 218, 255, 0.26)',
    shadowColor: '#4ec7ff',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
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
