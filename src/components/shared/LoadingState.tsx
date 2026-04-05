type LoadingStateProps = {
  title: string;
  message: string;
};

export function LoadingState(props: LoadingStateProps) {
  return (
    <section class="loading-state" aria-live="polite">
      <div class="loading-state__orb" aria-hidden="true" />
      <div class="loading-state__copy">
        <p class="eyebrow">Loading the sats context</p>
        <h2>{props.title}</h2>
        <p>{props.message}</p>
      </div>
    </section>
  );
}
