const intiialContext = {
  personalInformation: {},
  documents: {},
};

export const kybViewSchema = {
  initial: 'idle',
  context: intiialContext,
  states: {
    idle: {
      on: {
        NEXT: 'personalInformation',
        ERROR_RESOLVING: 'errorResolving',
      },
    },
    personalInformation: {
      on: {
        SAVE_DATA: {
          actions: ['updateStateData'],
        },
        NEXT: {
          target: 'documents',
        },
      },
    },
    documents: {
      on: {
        NEXT: {
          target: 'final',
        },
      },
    },
    errorResolving: {},
    revision: {},
    final: {
      type: 'final' as const,
    },
  },
};
