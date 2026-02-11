import { useEffect } from 'react';
import { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence,
    withDelay,
    cancelAnimation,
    Easing,
    EasingFunction,
    WithTimingConfig
} from 'react-native-reanimated';
import { AnimationConfig, EasingType } from './AnimationBuilder';

export const useElementAnimation = (config: AnimationConfig | undefined) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotation = useSharedValue(0);

    const reset = () => {
        cancelAnimation(scale);
        cancelAnimation(opacity);
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(rotation);

        scale.value = 1;
        opacity.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        rotation.value = 0;
    };

    useEffect(() => {
        const reset = () => {
            cancelAnimation(scale);
            cancelAnimation(opacity);
            cancelAnimation(translateX);
            cancelAnimation(translateY);
            cancelAnimation(rotation);

            scale.value = 1;
            opacity.value = 1;
            translateX.value = 0;
            translateY.value = 0;
            rotation.value = 0;
        };
        
        reset();
        
        if (!config || config.type === 'none') return;

        const duration = config.duration ?? 1000;
        const delay = config.delay ?? 0;
        const repeatCount = config.repeat ?? 1; // -1 is infinite
        const reverse = config.reverse ?? false;

        const getEasing = (t: EasingType | undefined): EasingFunction => {
            switch(t) {
                case 'linear': return Easing.linear;
                case 'bounce': return Easing.bounce;
                case 'elastic': return Easing.elastic(1);
                case 'easeIn': return Easing.in(Easing.ease);
                case 'easeOut': return Easing.out(Easing.ease);
                case 'easeInOut': return Easing.inOut(Easing.ease);
                default: return Easing.inOut(Easing.ease);
            }
        };

        const animConfig: WithTimingConfig = { 
            duration, 
            easing: getEasing(config.easing) 
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const withLoop = (anim: any) => {
            if (repeatCount === -1) {
                return withRepeat(anim, -1, reverse);
            } else if (repeatCount > 1) {
                return withRepeat(anim, repeatCount, reverse);
            }
            return anim;
        };
        
        // Wait for delay then start
        const startAnimation = () => {
             switch (config.type) {
                case 'fadeIn':
                    opacity.value = 0;
                    opacity.value = withDelay(delay, withLoop(withTiming(1, animConfig)));
                    break;
                case 'fadeOut':
                    opacity.value = 1;
                    opacity.value = withDelay(delay, withLoop(withTiming(0, animConfig)));
                    break;
                case 'scaleIn':
                    scale.value = 0;
                    scale.value = withDelay(delay, withLoop(withTiming(1, animConfig)));
                    break;
                case 'scaleOut':
                    scale.value = 1;
                    scale.value = withDelay(delay, withLoop(withTiming(0, animConfig)));
                    break;
                case 'pulse':
                    scale.value = withDelay(delay, withLoop(withSequence(withTiming(1.1, animConfig), withTiming(1, animConfig))));
                    break;
                case 'spin':
                    rotation.value = withDelay(delay, withLoop(withTiming(360, { ...animConfig, duration: duration })));
                    break;
                case 'slideUp':
                    translateY.value = 50;
                    translateY.value = withDelay(delay, withLoop(withTiming(0, animConfig)));
                    break;
                case 'slideDown':
                    translateY.value = -50;
                    translateY.value = withDelay(delay, withLoop(withTiming(0, animConfig)));
                    break;
                case 'slideLeft':
                    translateX.value = 50;
                    translateX.value = withDelay(delay, withLoop(withTiming(0, animConfig)));
                    break;
                case 'slideRight':
                    translateX.value = -50;
                    translateX.value = withDelay(delay, withLoop(withTiming(0, animConfig)));
                    break;
                case 'bounce':
                    translateY.value = 0;
                    translateY.value = withDelay(delay, withLoop(withSequence(
                        withTiming(-20, { duration: duration / 2, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: duration / 2, easing: Easing.in(Easing.quad) })
                    )));
                    break;
                 case 'shake':
                    translateX.value = 0;
                    translateX.value = withDelay(delay, withLoop(withSequence(
                        withTiming(-10, { duration: duration / 6 }),
                        withTiming(10, { duration: duration / 6 }),
                        withTiming(-10, { duration: duration / 6 }),
                        withTiming(10, { duration: duration / 6 }),
                        withTiming(-10, { duration: duration / 6 }),
                        withTiming(0, { duration: duration / 6 })
                    )));
                    break;
            }
        };

        startAnimation();

    }, [config, opacity, rotation, scale, translateX, translateY]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotation.value}deg` },
            ],
        };
    });

    return animatedStyle;
};
