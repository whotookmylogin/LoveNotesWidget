// File management for persistent storage
const FM = FileManager.local();
const STORAGE_DIR = FM.joinPath(FM.documentsDirectory(), "love-notes");
const HISTORY_FILE = FM.joinPath(STORAGE_DIR, "message-history.json");
const MESSAGES_FILE = FM.joinPath(STORAGE_DIR, "message-library.json");
const LIBRARY_STATE_FILE = FM.joinPath(STORAGE_DIR, "library-state.json");

// Ensure storage directory exists
if (!FM.fileExists(STORAGE_DIR)) {
    FM.createDirectory(STORAGE_DIR);
}

// Configuration
const config = {
    phoneNumber: "your-phone-here", // Format: +1234567890
    openAIKey: "your-api-key-here",
    location: {
        lat: your-latitude, // Your Latitude
        lon: your-longitude // Your Longitude
    },
    messageRotationCount: 20,
    maxHistoryItems: 100,
    refreshThreshold: 25 // Messages before AI refresh
};

// Initial message library
const defaultMessageLibrary = {
    timeOfDay: {
        morning: [
            "Good morning, sunshine! ☀️",
            "Starting my day thinking of you 🌅",
            "Hope your morning is bright ✨",
            "Rise and shine, beautiful 🌞",
            "Morning thoughts of you 🌄"
        ],
        afternoon: [
            "Brightening your afternoon ☀️",
            "Sending mid-day love 💫",
            "A little afternoon joy 🌟",
            "Making your day sparkle ✨",
            "Afternoon smile for you 🌞"
        ],
        evening: [
            "Sweet evening thoughts 🌙",
            "Winding down thinking of you ⭐",
            "Evening love note 🌆",
            "Starlit thoughts of you 🌟",
            "Peaceful evening wishes 🌙"
        ]
    },
    emojis: {
        hearts: ["❤️", "💖", "💝", "💕", "💓", "💗", "💞"],
        faces: ["🥰", "😘", "☺️", "😊", "🤗"],
        nature: ["✨", "🌟", "💫", "🌸", "🌺"],
        weather: ["☀️", "🌤️", "⛅", "🌥️", "🌙"]
    }
};

// Library State Management
class LibraryStateManager {
    constructor() {
        this.state = this.loadState();
    }

    loadState() {
        try {
            if (FM.fileExists(LIBRARY_STATE_FILE)) {
                return JSON.parse(FM.readString(LIBRARY_STATE_FILE));
            }
        } catch (error) {
            console.log("Error loading library state:", error);
        }
        return {
            useCount: 0,
            lastRefresh: Date.now(),
            messages: defaultMessageLibrary
        };
    }

    saveState() {
        FM.writeString(LIBRARY_STATE_FILE, JSON.stringify(this.state));
    }

    incrementUseCount() {
        this.state.useCount++;
        this.saveState();
        console.log(`Message use count: ${this.state.useCount}`);
    }

    needsRefresh() {
        return this.state.useCount >= config.refreshThreshold;
    }

    resetUseCount() {
        this.state.useCount = 0;
        this.state.lastRefresh = Date.now();
        this.saveState();
    }

    updateMessages(newMessages) {
        this.state.messages = {
            ...this.state.messages,
            ...newMessages
        };
        this.saveState();
    }

    getMessages() {
        return this.state.messages;
    }
}

// Weather service
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
            1: "mostly clear",
            2: "partly cloudy",
            3: "cloudy",
            45: "foggy",
            48: "foggy",
            51: "drizzly",
            53: "drizzly",
            55: "drizzly",
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

// Message Generator
class MessageGenerator {
    constructor() {
        this.weatherService = new WeatherService();
        this.libraryState = new LibraryStateManager();
    }

    async refreshLibrary() {
        if (!config.openAIKey || !this.libraryState.needsRefresh()) return false;

        try {
            const weather = await this.weatherService.getCurrentWeather();
            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

            console.log("Refreshing message library with AI...");

            const prompt = `Generate 5 new romantic messages for each time of day (morning, afternoon, evening) that match this style:
                Example morning: "Good morning, sunshine! ☀️"
                Example afternoon: "Brightening your afternoon 💫"
                Example evening: "Sweet evening thoughts 🌙"
                
                Consider:
                - Location: Saint Marys, Kansas
                - Local references (prairie, campus, small town)
                - Keep messages short and sweet
                - Match the emotional tone of the examples
                
                Format response as JSON:
                {
                    "timeOfDay": {
                        "morning": ["message1", "message2", ...],
                        "afternoon": ["message1", "message2", ...],
                        "evening": ["message1", "message2", ...]
                    }
                }`;

            const request = new Request("https://api.openai.com/v1/chat/completions");
            request.method = "POST";
            request.headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.openAIKey}`
            };
            request.body = JSON.stringify({
                model: "gpt-3.5-turbo-1106",
                messages: [{
                    role: "system",
                    content: "You are a helpful assistant that generates romantic messages matching a specific style and tone."
                }, {
                    role: "user",
                    content: prompt
                }],
                response_format: { "type": "json_object" },
                temperature: 0.7
            });

            const response = await request.loadJSON();
            console.log("AI Response received");
            
            if (response.error) {
                console.error("OpenAI Error:", response.error);
                return false;
            }

            const content = response.choices[0].message.content;
            const newMessages = JSON.parse(content);
            
            // Update library with new messages
            this.libraryState.updateMessages({
                timeOfDay: {
                    morning: [...defaultMessageLibrary.timeOfDay.morning, ...newMessages.timeOfDay.morning],
                    afternoon: [...defaultMessageLibrary.timeOfDay.afternoon, ...newMessages.timeOfDay.afternoon],
                    evening: [...defaultMessageLibrary.timeOfDay.evening, ...newMessages.timeOfDay.evening]
                }
            });
            
            this.libraryState.resetUseCount();
            console.log("Message library refreshed successfully");
            
            // Show refresh notification
            const notification = new Notification();
            notification.title = "Message Library Refreshed ✨";
            notification.body = "Added new romantic messages to the collection";
            notification.schedule();
            
            return true;
        } catch (error) {
            console.error("Library Refresh Error:", error);
            return false;
        }
    }

    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    combineEmojis() {
        const count = Math.floor(Math.random() * 2) + 1;
        const messages = this.libraryState.getMessages();
        const types = Object.keys(messages.emojis);
        let emojis = [];
        for (let i = 0; i < count; i++) {
            const type = this.getRandomItem(types);
            emojis.push(this.getRandomItem(messages.emojis[type]));
        }
        return emojis.join("");
    }

    async generateMessage(messageHistory) {
        // Check if library needs refresh
        if (this.libraryState.needsRefresh()) {
            console.log("Message threshold reached, attempting refresh");
            await this.refreshLibrary();
        }
        
        const hour = new Date().getHours();
        const timeKey = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
        const messages = this.libraryState.getMessages();
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const timeMessage = this.getRandomItem(messages.timeOfDay[timeKey]);
            const emoji = this.combineEmojis();
            const message = `${timeMessage} ${emoji}`;
            
            if (!messageHistory.wasRecentlyUsed(message)) {
                this.libraryState.incrementUseCount();
                return message;
            }
            
            attempts++;
        }
        
        // Final fallback
        const fallbackMessage = `Thinking of you ${this.combineEmojis()}`;
        this.libraryState.incrementUseCount();
        return fallbackMessage;
    }
}

// Message History Management
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

// Widget Creation
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
        const messageGen = new MessageGenerator();
        
        const message = await messageGen.generateMessage(messageHistory);
        
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
        
        // Configure widget tap action
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
