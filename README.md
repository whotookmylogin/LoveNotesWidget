# Love Notes Widget 💌

A sophisticated iOS widget built with Scriptable that sends personalized, context-aware love messages. Combines local weather data, time-based messaging, and optional AI-generated content to create unique, meaningful messages for your special someone.

## Features ✨

- **Weather-Aware Messages**: Integrates with Open-Meteo API for real-time weather conditions
- **Time-Based Content**: Different messages for morning, afternoon, and evening
- **Location Context**: Custom messages referencing Saint Marys, KS locations and activities
- **Message Categories**:
  - Romantic messages
  - Playful messages
  - Deep/meaningful messages
  - Weather-specific messages
  - Time-of-day greetings
- **Smart Message Rotation**: Prevents message repetition (20-message history)
- **AI Integration**: Optional OpenAI integration for dynamic, contextual messages
- **Elegant Widget Design**: Clean, attractive home screen widget
- **Delivery Notifications**: Success/failure notifications for message status

## Requirements 📱

- iOS device
- [Scriptable app](https://apps.apple.com/us/app/scriptable/id1405459188) installed
- OpenAI API key (optional)

## Installation 🚀

1. Install Scriptable from the App Store
2. Create a new script in Scriptable
3. Copy the entire script code
4. Configure your settings:
   ```javascript
   const config = {
       phoneNumber: "your-number-here", // Format: +1234567890
       openAIKey: "your-openai-key-here", // Optional
       location: {
           lat: 39.1975, // Saint Marys, KS
           lon: -96.0711
       }
   };
   ```
5. Run the script once to test
6. Add the widget to your home screen:
   - Long press your home screen
   - Tap the + button
   - Search for "Scriptable"
   - Choose small widget size
   - Add and select this script

## Features Deep Dive 🔍

### Message Categories
- **Time-Based**: Different messages for morning, afternoon, and evening
- **Weather-Based**: Custom messages based on current conditions
- **Mixed Styles**: 
  - Sweet and romantic
  - Fun and playful
  - Deep and meaningful
  - Local references and activities

### AI Integration
- Uses OpenAI's GPT-3.5 for dynamic message generation
- Includes local context and current conditions
- Falls back to preset messages if AI is unavailable
- Combines AI messages with custom templates

### Smart Delivery
- Message history tracking
- Prevents recent message repetition
- Delivery confirmations
- Error handling with notifications

## Customization 🎨

### Adding Custom Messages
Edit the `messageLibrary` object to add your own messages:
```javascript
messageLibrary = {
    romantic: [
        "your custom message here",
        // Add more messages
    ],
    // Other categories...
};
```

### Modifying Weather Settings
The widget uses Open-Meteo API for weather data. You can customize weather messages in the `weather` category of the message library.

## Technical Details 🔧

- Built with JavaScript for Scriptable
- Uses native iOS Messages app for sending
- Integrates with Open-Meteo API for weather data
- Optional OpenAI GPT-3.5 integration
- Local storage for message history
- Efficient message caching system

## Contributing 🤝

Feel free to submit issues and enhancement requests!

## Privacy Notice 🔒

This widget:
- Runs entirely on your device
- Only sends messages to your specified recipient
- Does not collect or share any data
- Weather and AI API calls are anonymous

## License 📄

MIT License - feel free to modify and use as you like!

## Acknowledgments 👏

- Built with [Scriptable](https://scriptable.app/)
- Weather data from [Open-Meteo](https://open-meteo.com/)
- Optional AI features powered by [OpenAI](https://openai.com/)

## Support 💪

For issues or questions:
1. Check the [issues](https://github.com/yourusername/love-notes-widget/issues) section
2. Review the Scriptable documentation
3. Create a new issue if needed

---

Made with ❤️ for sending love notes
