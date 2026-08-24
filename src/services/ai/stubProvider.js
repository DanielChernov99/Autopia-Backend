export const stubProvider = {
  async generateResponse({ messages }) {
    return {
      content: `קיבלתי את ההודעה שלך. זהו מענה הדגמה המבוסס על ${messages.length} הודעות אחרונות בשיחה.`,
    };
  },
};
