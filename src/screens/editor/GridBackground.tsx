import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line, G } from 'react-native-svg';
import { useColors } from '../../theme/hooks';

interface GridBackgroundProps {
    gridSize: number;
    visible: boolean;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ gridSize, visible }) => {
    const colors = useColors();
    
    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Svg height="100%" width="100%">
                <Defs>
                    <Pattern
                        id="grid"
                        width={gridSize}
                        height={gridSize}
                        patternUnits="userSpaceOnUse"
                    >
                        <Line
                            x1="0"
                            y1="0"
                            x2="0"
                            y2={gridSize}
                            stroke={colors.onSurface}
                            strokeWidth="1"
                            strokeOpacity="0.2"
                        />
                        <Line
                            x1="0"
                            y1="0"
                            x2={gridSize}
                            y2="0"
                            stroke={colors.onSurface}
                            strokeWidth="1"
                            strokeOpacity="0.2"
                        />
                    </Pattern>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
});
