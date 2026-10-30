/** Fit the play surface to the visible window without hiding game controls. */
export function fitBoard(stage: HTMLElement) {
  let frame = 0;
  const board = stage.querySelector<HTMLElement>('.board-column')!;
  const wrap = stage.querySelector<HTMLElement>('.board-wrap')!;
  const coach = stage.querySelector<HTMLElement>('.coach-dock')!;
  const measure = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const style = getComputedStyle(stage);
      const stacked = style.display === 'flex' && style.flexDirection === 'column';
      const insetX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const insetY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const gap = parseFloat(style.gap) || 0;
      const chrome = board.getBoundingClientRect().height - wrap.getBoundingClientRect().height;
      const width = stage.clientWidth - insetX - (stacked ? 0 : coach.getBoundingClientRect().width + gap);
      const height = stage.clientHeight - insetY - chrome - (stacked ? coach.getBoundingClientRect().height + gap : 0);
      const size = Math.max(80,Math.floor(Math.min(width,height,720)));
      if (stage.style.getPropertyValue('--board-size') !== `${size}px`) stage.style.setProperty('--board-size',`${size}px`);
    });
  };
  const observer = new ResizeObserver(measure);
  [stage,board,coach].forEach(node=>observer.observe(node));
  window.addEventListener('resize',measure);
  window.visualViewport?.addEventListener('resize',measure);
  measure();
  return {destroy() {cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',measure);window.visualViewport?.removeEventListener('resize',measure);}};
}
