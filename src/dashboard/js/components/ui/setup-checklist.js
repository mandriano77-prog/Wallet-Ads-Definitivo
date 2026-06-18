/**
 * A2W setup checklist — ordered onboarding steps (A2W shell only).
 */
(function (global) {
  'use strict';

  const { createEl } = global.A2W.UI.utils;

  /**
   * @param {{ title?: string, intro?: string, progressLabel?: string, steps: Array<{ id: string, label: string, description?: string, done: boolean, actionLabel?: string }>, onStepClick: (stepId: string) => void }} props
   */
  function createSetupChecklist(props) {
    props = props || {};
    const steps = Array.isArray(props.steps) ? props.steps : [];
    const doneCount = steps.filter((s) => s.done).length;

    const root = createEl('section', 'a2w-ui-setup-checklist card', {
      'data-a2w-component': 'setup-checklist',
      'aria-label': 'Setup guidato brand'
    });

    const head = createEl('div', 'a2w-ui-setup-checklist__head');
    head.appendChild(createEl('h2', 'a2w-ui-setup-checklist__title', { text: props.title || 'Setup guidato' }));
    if (props.intro) {
      head.appendChild(createEl('p', 'a2w-ui-setup-checklist__intro', { text: props.intro }));
    }
    head.appendChild(createEl('p', 'a2w-ui-setup-checklist__progress', {
      text: props.progressLabel || (doneCount + ' di ' + steps.length + ' completati'),
      'aria-live': 'polite'
    }));
    root.appendChild(head);

    const list = createEl('ol', 'a2w-ui-setup-checklist__list');
    steps.forEach((step, index) => {
      const done = !!step.done;
      const item = createEl('li', 'a2w-ui-setup-checklist__item' + (done ? ' is-done' : ' is-pending'), {
        'data-step-id': step.id
      });

      const check = createEl('span', 'a2w-ui-setup-checklist__check', {
        attrs: { 'aria-hidden': 'true' }
      });
      check.textContent = done ? '✓' : String(index + 1);
      item.appendChild(check);

      const body = createEl('div', 'a2w-ui-setup-checklist__body');
      body.appendChild(createEl('div', 'a2w-ui-setup-checklist__label', { text: step.label || '' }));
      if (step.description) {
        body.appendChild(createEl('div', 'a2w-ui-setup-checklist__desc', { text: step.description }));
      }
      item.appendChild(body);

      if (!done) {
        const btn = createEl('button', 'a2w-ui-setup-checklist__action btn small sec', {
          type: 'button',
          text: step.actionLabel || 'Vai',
          attrs: { 'data-step-id': step.id }
        });
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (typeof props.onStepClick === 'function') props.onStepClick(step.id);
        });
        item.appendChild(btn);
      } else {
        item.appendChild(createEl('span', 'a2w-ui-setup-checklist__done-label', { text: 'Completato' }));
      }

      list.appendChild(item);
    });

    root.appendChild(list);
    return root;
  }

  global.A2W.UI.createSetupChecklist = createSetupChecklist;
})((typeof window !== 'undefined' ? window : global));
