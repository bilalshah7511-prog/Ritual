import { useEffect, useMemo, useRef } from 'react';
import LottieImport from 'lottie-react';
import checkAnimation from '../assets/lottie/check.json';
import crossAnimation from '../assets/lottie/cross.json';

const Lottie =
  typeof LottieImport === 'function'
    ? LottieImport
    : typeof LottieImport?.default === 'function'
      ? LottieImport.default
      : LottieImport?.default?.default || LottieImport?.LottiePlayer;

const animations = {
  check: checkAnimation,
  error: crossAnimation,
};

function cloneAnimation(data) {
  try {
    return typeof structuredClone === 'function'
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
}

export default function MicroAnim({
  type = 'check',
  loop = false,
  speed = 1.75,
  className = '',
  onComplete,
}) {
  const lottieRef = useRef(null);
  const playId = useRef(0);

  const data = useMemo(() => {
    playId.current += 1;
    return cloneAnimation(animations[type] || animations.check);
  }, [type]);

  useEffect(() => {
    const instance = lottieRef.current;
    if (!instance || typeof instance.setSpeed !== 'function') return undefined;
    try {
      instance.setSpeed(speed);
    } catch {
      // ignore
    }
    return undefined;
  }, [speed, data]);

  if (typeof Lottie !== 'function') {
    return (
      <div className={`micro-anim micro-anim--${type} ${className}`.trim()} aria-hidden="true">
        <div className="micro-anim__stage micro-anim__stage--fallback">
          {type === 'error' ? '✕' : '✓'}
        </div>
      </div>
    );
  }

  return (
    <div className={`micro-anim micro-anim--${type} ${className}`.trim()}>
      <div className="micro-anim__stage">
        <Lottie
          key={`${type}-${playId.current}`}
          lottieRef={lottieRef}
          animationData={data}
          loop={loop}
          autoplay
          onComplete={onComplete}
          className="micro-anim__lottie"
        />
      </div>
    </div>
  );
}
