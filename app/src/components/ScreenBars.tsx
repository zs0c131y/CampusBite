import { StatusBar } from 'expo-status-bar';

type BarStyle = 'light' | 'dark';

interface ScreenBarsProps {
  style?: BarStyle;
  backgroundColor?: string;
}

export function ScreenBars({ style = 'dark', backgroundColor }: ScreenBarsProps) {
  return <StatusBar style={style} backgroundColor={backgroundColor} />;
}