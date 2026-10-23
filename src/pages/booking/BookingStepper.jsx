import { CheckIcon } from '@/components/ui/icons';

/** Langkah pemesanan; langkah aktif = langkah pertama yang belum selesai. */
export default function BookingStepper({ steps }) {
  const current = steps.findIndex((step) => !step.done);

  return (
    <nav aria-label="Langkah pemesanan" className="stepper">
      <ol className="stepper__list">
        {steps.map((step, index) => {
          const state = step.done ? 'done' : index === current ? 'current' : 'todo';
          const statusText = { done: 'Selesai', current: 'Sedang diisi', todo: 'Belum' }[state];
          return (
            <li
              key={step.label}
              className={`stepper__step stepper__step--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="stepper__marker" aria-hidden="true">
                {state === 'done' ? <CheckIcon size={20} /> : index + 1}
              </span>
              <span className="stepper__text">
                <span className="stepper__label">{step.label}</span>
                <span className="stepper__status">{statusText}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
