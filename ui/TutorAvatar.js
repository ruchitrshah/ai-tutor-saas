// The tutor's mark, the same as the browser-tab icon: a solid blue disc with a white spark.
// Used wherever the tutor needs a face (chat avatars, headers, the phone tutor button).
// `hovered` takes the standard blue hover (the same slight dim the primary Button uses).
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '../brand';

export default function TutorAvatar({ size = 36, hovered = false, style }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx="32" cy="32" r="32" fill={hovered ? Colors.brand.edge : Colors.brand.primary} />
      <Path d="M32 14l4.6 13.4L50 32l-13.4 4.6L32 50l-4.6-13.4L14 32l13.4-4.6z" fill="#FFFFFF" />
    </Svg>
  );
}
