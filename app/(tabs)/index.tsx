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

const SPHERE_SOURCE = require('@/assets/images/stay-sphere-reference.jpg');

function LivingSphere({ size }: { size: number }) {
  const rotationA = useRef(new Animated.Value(0)).current;
  const rotationB = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateOuter = Animated.loop(
      Animated.timing(rotationA, {
        toValue: 1,
        duration: 52000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const rotateInner = Animated.loop(
      Animated.timing(rotationB, {
        toValue: 1,
        duration: 76000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    rotateOuter.start();
    rotateInner.start();
    breathe.start();
    glowLoop.start();

    return () => {
      rotateOuter.stop();
      rotateInner.stop();
      breathe.stop();
      glowLoop.stop();
    };
  }, [glow, pulse, rotationA, rotationB]);

  const outerRotate = rotationA.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const innerRotate = rotationB.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.992, 1.018],
  });

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.24, 0.42],
  });

  return (
    <Animated.View
      style={[
        styles.sphereWrap,
        {
          width: size,
          height: size,
          transform: [{ scale }],
        },
      ]}>
      <Animated.View
        style={[
          styles.sphereGlow,
          {
            width: size * 0.94,
            height: size * 0.94,
            borderRadius: size,
            opacity: glowOpacity,
          },
        ]}
      />

      <View style={[styles.sphereMask, { width: size, height: size, borderRadius: size }]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ rotate: outerRotate }, { scale: 1.02 }] },
          ]}>
          <Image
            source={SPHERE_SOURCE}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: 0.22,
              transform: [{ rotate: innerRotate }, { scale: 1.08 }],
            },
          ]}>
          <Image
            source={SPHERE_SOURCE}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </Animated.View>

        <View style={styles.glassHighlight} />
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const sphereSize = useMemo(() => Math.min(SCREEN_WIDTH * 0.92, 430), []);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.backgroundCenterGlow} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>STAY</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.progressText}>2 / 5 today</Text>
        </View>

        <View style={styles.sphereZone}>
          <LivingSphere size={sphereSize} />
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
  backgroundCenterGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.6,
    height: SCREEN_WIDTH * 1.6,
    borderRadius: SCREEN_WIDTH,
    left: -SCREEN_WIDTH * 0.3,
    top: '22%',
    backgroundColor: 'rgba(0,85,180,0.16)',
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
    marginTop: -4,
  },
  sphereWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereGlow: {
    position: 'absolute',
    backgroundColor: '#0B5FEA',
    shadowColor: '#27A8FF',
    shadowOpacity: 0.9,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  sphereMask: {
    overflow: 'hidden',
    backgroundColor: '#041332',
  },
  glassHighlight: {
    position: 'absolute',
    width: '64%',
    height: '24%',
    top: '7%',
    left: '12%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '-15deg' }],
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
