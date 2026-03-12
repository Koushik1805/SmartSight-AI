// Language name to BCP-47 locale code mapping for Web Speech API
const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  'English': 'en-US',
  'Hindi': 'hi-IN',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Italian': 'it-IT',
  'Portuguese': 'pt-BR',
  'Russian': 'ru-RU',
  'Japanese': 'ja-JP',
  'Korean': 'ko-KR',
  'Chinese': 'zh-CN',
  'Arabic': 'ar-SA',
  'Tamil': 'ta-IN',
  'Telugu': 'te-IN',
  'Bengali': 'bn-IN',
  'Marathi': 'mr-IN',
  'Gujarati': 'gu-IN',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Punjabi': 'pa-IN',
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const initAudio = () => {
  // No-op: Web Speech API doesn't need pre-warming
};

export const playSpeech = async (text: string, language: string = 'English'): Promise<boolean> => {
  try {
    stopSpeech();

    if (!('speechSynthesis' in window)) {
      console.error('Web Speech API not supported in this browser.');
      return false;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance = utterance;

      // Set language/locale
      const locale = LANGUAGE_LOCALE_MAP[language] || 'en-US';
      utterance.lang = locale;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to pick a voice matching the locale
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice =
        voices.find(v => v.lang === locale) ||
        voices.find(v => v.lang.startsWith(locale.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        currentUtterance = null;
        resolve(true);
      };

      utterance.onerror = (e) => {
        console.error('SpeechSynthesis error:', e);
        currentUtterance = null;
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error('TTS Playback Error:', error);
    return false;
  }
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
};
