// File management for persistent storage
const FM = FileManager.local();
const STORAGE_DIR = FM.joinPath(FM.documentsDirectory(), "love-notes");
const HISTORY_FILE = FM.joinPath(STORAGE_DIR, "message-history.json");
const MESSAGES_FILE = FM.joinPath(STORAGE_DIR, "message-library.json");

// Ensure storage directory exists
if (!FM.fileExists(STORAGE_DIR)) {
    FM.createDirectory(STORAGE_DIR);
}

// Configuration - EDIT THESE TWO LINES
const config = {
    phoneNumber: "+your-phone-number", // Format: +1234567890
    openAIKey: "sk-your-openai-key", // Your OpenAI API key
    location: {
        lat: your-latitude, // Your Latitude
        lon: your-longitude // Your Longitude
    },
    messageRotationCount: 20,
    maxHistoryItems: 100
};

// Message Categories
const messageLibrary = {
    timeOfDay: {
        morning: [
            "Good morning, sunshine!",
            "Starting my day thinking of you",
            "Hope your morning is as beautiful as you",
            "Sending you morning smiles",
            "Rise and shine, gorgeous"
        ],
        afternoon: [
            "Hope your day is going well",
            "Brightening your afternoon",
            "Taking a moment to think of you",
            "Making your day a little sweeter",
            "Sending mid-day love"
        ],
        evening: [
            "Winding down and thinking of you",
            "Hope your evening is peaceful",
            "Sending you end-of-day love",
            "Sweet dreams ahead",
            "Wrapping up the day with thoughts of you"
        ]
    },
    romantic: [
        "You mean everything to me",
        "Every day with you is a gift",
        "You're the best part of my story",
        "My heart smiles when I think of you",
        "You're my favorite thought",
        "Life is beautiful because of you",
        "You're my perfect match",
        "Forever grateful for your love",
        "You're my dream come true",
        "My heart beats for you"
    ],
    playful: [
        "You're my favorite notification 📱",
        "Consider yourself virtually hugged 🤗",
        "Loading... love.exe 💝",
        "Warning: extreme cuteness ahead 🚨",
        "Incoming cuddles! 🤗",
        "Just spreading some joy your way",
        "Consider this a digital kiss 😘",
        "Here's your daily dose of love 💕",
        "Beep boop - you're cute! 🤖",
        "Achievement unlocked: made you smile! 🏆"
    ],
    deep: [
        "You inspire me to be better every day",
        "Your love makes everything possible",
        "You're the answer to my prayers",
        "Every moment with you is precious",
        "You make my world complete",
        "Our love story is my favorite",
        "You're my safe harbor in any storm",
        "Life with you is beautiful chaos",
        "You're my best decision ever",
        "Our love grows deeper each day"
    ],
    weather: {
        clear: [
            "As bright as this sunny day",
            "Clear skies and clear thoughts of you",
            "Sunshine reminds me of your smile"
        ],
        cloudy: [
            "You brighten even the cloudiest day",
            "Grey skies can't dim my love for you",
            "Thinking warm thoughts of you"
        ],
        rainy: [
            "You're my cozy thought on this rainy day",
            "Rain or shine, you're on my mind",
            "Perfect weather for cuddling"
        ],
        snowy: [
            "Sending you warm thoughts in the snow",
            "You melt my heart like snowflakes",
            "Cold outside but warm thoughts of you"
        ],
        stormy: [
            "You're my calm in every storm",
            "Thunder reminds me of my heart when I see you",
            "Weather's wild but my love is steady"
        ]
    },
    emojis: ["❤️", "🥰", "😘", "💖", "💝", "😊", "✨", "🌟", "💫", "💕", "💞", "💓"]
};

// Weather service class
class WeatherService {
    constructor() {
        this.cache = null;
        this.lastFetch = 0;
        this.cacheDuration = 30 * 60 * 1000; // 30 minutes
    }

    async getCurrentWeather() {
        if (this.cache && (Date.now() - this.lastFetch) < this.cacheDuration) {
            return this.cache;
        }

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.location.lat}&longitude=${config.location.lon}&current=temperature,weather_code,is_day&temperature_unit=fahrenheit`;
            const req = new Request(url);
            const data = await req.loadJSON();

            const weatherCode = data.current.weather_code;
            const isDay = data.current.is_day;
            const temp = Math.round(data.current.temperature);

            const weather = {
                description: this.getWeatherDescription(weatherCode, isDay),
                temperature: temp,
                isDay: isDay === 1
            };

            this.cache = weather;
            this.lastFetch = Date.now();
            return weather;
        } catch (error) {
            console.error("Weather fetch error:", error);
            return {
                description: "clear",
                temperature: 70,
                isDay: true
            };
        }
    }

    getWeatherDescription(code, isDay) {
        const weatherCodes = {
            0: "clear",
            1: "clear",
            2: "cloudy",
            3: "cloudy",
            45: "cloudy",
            48: "cloudy",
            51: "rainy",
            53: "rainy",
            55: "rainy",
            61: "rainy",
            63: "rainy",
            65: "rainy",
            71: "snowy",
            73: "snowy",
            75: "snowy",
            77: "snowy",
            80: "rainy",
            81: "rainy",
            82: "rainy",
            85: "snowy",
            86: "snowy",
            95: "stormy",
            96: "stormy",
            99: "stormy"
        };
        return weatherCodes[code] || "clear";
    }
}
// Open AI integration

class AIMessageGenerator {
    constructor(openAIKey) {
        this.openAIKey = openAIKey;
    }

    async generateAIMessages(context) {
        if (!this.openAIKey) {
            console.log("No OpenAI key provided");
            return [];
        }

        try {
            // Get current month for seasonal/holiday context
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            const currentMonth = months[new Date().getMonth()];
            
            const prompt = `Generate 3 unique, romantic messages considering these details about Saint Marys, Kansas:

Current Context:
- Time: ${context.hour}:00 (${context.timeOfDay})
- Weather: ${context.weather.description} at ${context.weather.temperature}°F
- Month: ${currentMonth}
- ${context.isWeekend ? 'Weekend' : 'Weekday'}

Local References:
- St. Mary's Academy and College campus
- The peaceful Kansas prairie
- Small-town charm and community
- Local landmarks like Mount Calvary Cemetery
- Kansas weather patterns and beautiful sunsets
- Downtown Saint Marys

Special Considerations:
- Include references to current season and any upcoming holidays
- Mention local activities appropriate for the weather
- Reference Kansas nature, landscapes, or activities
- If it's a nice day, maybe mention walking downtown or campus
- If it's stormy/cold, perhaps reference staying cozy inside

Make messages feel personal and natural, mixing in these elements subtly. Each message should be a complete thought, about 1-2 sentences long. Return them as a JSON array of strings.

Example themes:
- Watching sunset over the prairie together
- Walking through downtown
- College campus beauty in different seasons
- Kansas weather and staying cozy
- Local events or seasonal activities

Return format: {"messages": ["message1", "message2", "message3"]}`;

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.openAIKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo-1106",
                    messages: [{
                        role: "user",
                        content: prompt
                    }],
                    response_format: { "type": "json_object" },
                    temperature: 0.8
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error("OpenAI Error:", data.error);
                return [];
            }

            const content = data.choices[0].message.content;
            const parsed = JSON.parse(content);
            
            // Log success for debugging
            console.log("Successfully generated AI messages");
            
            return parsed.messages || [];

        } catch (error) {
            console.error("AI Generation Error:", error);
            
            // Show error notification
            const notification = new Notification();
            notification.title = "AI Message Generation";
            notification.body = "Falling back to preset messages";
            notification.schedule();
            
            return [];
        }
    }
}

// Modify the generateMessage function to incorporate AI messages
async function generateMessage(messageHistory) {
    const weather = new WeatherService();
    const currentWeather = await weather.getCurrentWeather();
    const hour = new Date().getHours();
    
    let timeCategory;
    if (hour < 12) timeCategory = "morning";
    else if (hour < 17) timeCategory = "afternoon";
    else timeCategory = "evening";
    
    // Try to get AI messages first
    const aiGenerator = new AIMessageGenerator(config.openAIKey);
    const context = {
        timeOfDay: timeCategory,
        hour: hour,
        weather: currentWeather,
        isWeekend: [0, 6].includes(new Date().getDay())
    };
    
    const aiMessages = await aiGenerator.generateAIMessages(context);
    
    // Combine AI and preset messages
    const allMessages = [
        ...aiMessages,
        ...messageLibrary.romantic,
        ...messageLibrary.playful,
        ...messageLibrary.deep
    ];

    function getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        // Prioritize AI messages if available
        const mainMessage = aiMessages.length > 0 && Math.random() > 0.3 
            ? getRandomItem(aiMessages) 
            : getRandomItem(allMessages);
            
        const emoji = getRandomItem(messageLibrary.emojis);
        
        // Sometimes add time-of-day or weather context
        const addContext = Math.random() > 0.7;
        const contextMessage = addContext 
            ? getRandomItem([
                getRandomItem(messageLibrary.timeOfDay[timeCategory]),
                getRandomItem(messageLibrary.weather[currentWeather.description])
              ])
            : '';
            
        const message = contextMessage 
            ? `${contextMessage} - ${mainMessage} ${emoji}`
            : `${mainMessage} ${emoji}`;
        
        if (!messageHistory.wasRecentlyUsed(message)) {
            return message;
        }
        
        attempts++;
    }
    
    // Fallback message
    return `${getRandomItem(messageLibrary.romantic)} ${getRandomItem(messageLibrary.emojis)}`;
}
// Message history management
class MessageHistory {
    constructor() {
        this.history = this.loadHistory();
    }

    loadHistory() {
        try {
            if (FM.fileExists(HISTORY_FILE)) {
                return JSON.parse(FM.readString(HISTORY_FILE));
            }
        } catch (error) {
            console.log("Error loading history:", error);
        }
        return [];
    }

    saveHistory() {
        FM.writeString(HISTORY_FILE, JSON.stringify(this.history));
    }

    addMessage(message) {
        this.history.unshift({
            message: message,
            timestamp: Date.now()
        });
        if (this.history.length > config.maxHistoryItems) {
            this.history = this.history.slice(0, config.maxHistoryItems);
        }
        this.saveHistory();
    }

    wasRecentlyUsed(message) {
        const recentMessages = this.history.slice(0, config.messageRotationCount);
        return recentMessages.some(item => item.message === message);
    }
}

// Generate a message combining different elements
async function generateMessage(messageHistory) {
    const weather = new WeatherService();
    const currentWeather = await weather.getCurrentWeather();
    const hour = new Date().getHours();
    
    // Determine time of day
    let timeCategory;
    if (hour < 12) timeCategory = "morning";
    else if (hour < 17) timeCategory = "afternoon";
    else timeCategory = "evening";
    
    // Get random items from each category
    function getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        // Build message components
        const timeMessage = getRandomItem(messageLibrary.timeOfDay[timeCategory]);
        const weatherMessage = getRandomItem(messageLibrary.weather[currentWeather.description]);
        const mainMessage = getRandomItem([
            ...messageLibrary.romantic,
            ...messageLibrary.playful,
            ...messageLibrary.deep
        ]);
        const emoji = getRandomItem(messageLibrary.emojis);
        
        // Combine components randomly
        const messageTemplates = [
            `${timeMessage} ${emoji}`,
            `${weatherMessage} ${emoji}`,
            `${mainMessage} ${emoji}`,
            `${timeMessage} - ${mainMessage} ${emoji}`,
            `${weatherMessage} - ${mainMessage} ${emoji}`
        ];
        
        const message = getRandomItem(messageTemplates);
        
        if (!messageHistory.wasRecentlyUsed(message)) {
            return message;
        }
        
        attempts++;
    }
    
    // Fallback message if all attempts failed
    return `${getRandomItem(messageLibrary.romantic)} ${getRandomItem(messageLibrary.emojis)}`;
}

// Create widget
function createWidget() {
    const widget = new ListWidget();
    
    // Widget background
    const gradient = new LinearGradient();
    gradient.colors = [new Color("#ff69b4"), new Color("#ff1493")];
    gradient.locations = [0.0, 1.0];
    widget.backgroundGradient = gradient;
    
    // Add padding
    widget.setPadding(16, 16, 16, 16);
    
    // Title stack
    const titleStack = widget.addStack();
    titleStack.layoutHorizontally();
    titleStack.centerAlignContent();
    titleStack.addSpacer();
    
    const title = titleStack.addText("Love Notes ");
    title.font = Font.boldSystemFont(16);
    title.textColor = Color.white();
    
    const heart = titleStack.addText("❤️");
    heart.font = Font.boldSystemFont(16);
    
    titleStack.addSpacer();
    
    widget.addSpacer(8);
    
    // Button text
    const button = widget.addText("Tap to Send");
    button.font = Font.systemFont(14);
    button.textColor = Color.white();
    button.centerAlignText();
    
    // Make widget tappable
    widget.url = 'scriptable:///run/' + Script.name();
    
    return widget;
}

// Send message function
async function sendMessage() {
    const startNotif = new Notification();
    startNotif.title = "Sending Love Note 💌";
    startNotif.body = "Preparing your message...";
    startNotif.schedule();
    
    try {
        const messageHistory = new MessageHistory();
        const message = await generateMessage(messageHistory);
        
        const msg = new Message();
        msg.body = message;
        msg.recipients = [config.phoneNumber];
        
        await msg.send();
        
        messageHistory.addMessage(message);
        
        const successNotif = new Notification();
        successNotif.title = "Love Note Sent! 💝";
        successNotif.body = message;
        successNotif.schedule();
        
        return true;
    } catch (error) {
        const errorNotif = new Notification();
        errorNotif.title = "Failed to Send";
        errorNotif.body = error.message;
        errorNotif.schedule();
        
        return false;
    }
}

// Main logic
async function run() {
    // Check if running from widget tap
    if (args.queryParameters?.run === "sendMessage") {
        await sendMessage();
    } else {
        // Normal widget setup
        const widget = createWidget();
        widget.url = 'scriptable:///run/' + Script.name() + '?run=sendMessage';
        
        if (config.widgetFamily === 'small') {
            Script.setWidget(widget);
        } else {
            await widget.presentMedium();
        }
    }
}

// Run the script
await run();
Script.complete();