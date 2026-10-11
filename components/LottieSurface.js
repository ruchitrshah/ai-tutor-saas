import LottieView from 'lottie-react-native';

// Thin seam so the web bundle never imports lottie-react-native, whose web
// build needs @lottiefiles/dotlottie-react. Web only serves share links, where
// the Discover decision moment never runs — see LottieSurface.web.js.
export default LottieView;
