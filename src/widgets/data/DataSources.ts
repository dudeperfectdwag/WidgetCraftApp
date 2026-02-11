/**
 * WidgetCraft - Data Sources
 * Live data providers for widget bindings
 */

import { DataBindingKey } from '../types';

// ============================================
// Data Provider Interface
// ============================================

export interface DataProvider {
    getValue(key: DataBindingKey): string | number | boolean;
    subscribe(key: DataBindingKey, callback: (value: any) => void): () => void;
}

// ============================================
// Time Data Source
// ============================================

const formatTime = (date: Date, format: '12h' | '24h' = '24h'): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (format === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes}`;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const getDayName = (date: Date, short = false): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return short ? shortDays[date.getDay()] : days[date.getDay()];
};

const getMonthName = (date: Date, short = false): string => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return short ? shortMonths[date.getMonth()] : months[date.getMonth()];
};

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

// ============================================
// Data Values Store
// ============================================

interface DataStore {
    time: {
        hours: string;
        minutes: string;
        seconds: string;
        formatted12: string;
        formatted24: string;
        ampm: string;
    };
    date: {
        day: string;
        dayName: string;
        dayShort: string;
        month: string;
        monthName: string;
        monthShort: string;
        year: string;
        formatted: string;
    };
    battery: {
        level: number;
        isCharging: boolean;
        icon: string;
    };
    weather: {
        temp: number;
        condition: string;
        icon: string;
        high: number;
        low: number;
    };
    device: {
        name: string;
        greeting: string;
    };
    music: {
        title: string;
        artist: string;
        album: string;
        isPlaying: boolean;
    };
}

// ============================================
// Create Data Store with Live Updates
// ============================================

let dataStore: DataStore = {
    time: {
        hours: '00',
        minutes: '00',
        seconds: '00',
        formatted12: '12:00',
        formatted24: '00:00',
        ampm: 'AM',
    },
    date: {
        day: '1',
        dayName: 'Monday',
        dayShort: 'Mon',
        month: '1',
        monthName: 'January',
        monthShort: 'Jan',
        year: '2024',
        formatted: 'Jan 1, 2024',
    },
    battery: {
        level: 75,
        isCharging: false,
        icon: 'battery-70',
    },
    weather: {
        temp: 23,
        condition: 'Partly Cloudy',
        icon: 'weather-partly-cloudy',
        high: 28,
        low: 18,
    },
    device: {
        name: 'My Device',
        greeting: 'Good morning',
    },
    music: {
        title: 'No Music',
        artist: 'Playing',
        album: '',
        isPlaying: false,
    },
};

// Get current weather data for export to native widgets
export const getCurrentWeatherData = () => ({
    temp: dataStore.weather.temp,
    condition: dataStore.weather.condition,
    icon: dataStore.weather.icon,
    high: dataStore.weather.high,
    low: dataStore.weather.low,
});

const listeners: Map<string, Set<(value: any) => void>> = new Map();

// Update time every second
const updateTime = () => {
    const now = new Date();

    dataStore = {
        ...dataStore,
        time: {
            hours: now.getHours().toString().padStart(2, '0'),
            minutes: now.getMinutes().toString().padStart(2, '0'),
            seconds: now.getSeconds().toString().padStart(2, '0'),
            formatted12: formatTime(now, '12h'),
            formatted24: formatTime(now, '24h'),
            ampm: now.getHours() >= 12 ? 'PM' : 'AM',
        },
        date: {
            day: now.getDate().toString(),
            dayName: getDayName(now),
            dayShort: getDayName(now, true),
            month: (now.getMonth() + 1).toString(),
            monthName: getMonthName(now),
            monthShort: getMonthName(now, true),
            year: now.getFullYear().toString(),
            formatted: `${getMonthName(now, true)} ${now.getDate()}, ${now.getFullYear()}`,
        },
        device: {
            ...dataStore.device,
            greeting: getGreeting(),
        },
    };

    // Notify time listeners
    notifyListeners('time.hours', dataStore.time.hours);
    notifyListeners('time.minutes', dataStore.time.minutes);
    notifyListeners('time.seconds', dataStore.time.seconds);
    notifyListeners('time.formatted12', dataStore.time.formatted12);
    notifyListeners('time.formatted24', dataStore.time.formatted24);
    notifyListeners('time.ampm', dataStore.time.ampm);
    notifyListeners('date.day', dataStore.date.day);
    notifyListeners('date.dayName', dataStore.date.dayName);
    notifyListeners('date.dayShort', dataStore.date.dayShort);
    notifyListeners('date.month', dataStore.date.month);
    notifyListeners('date.monthName', dataStore.date.monthName);
    notifyListeners('date.monthShort', dataStore.date.monthShort);
    notifyListeners('date.year', dataStore.date.year);
    notifyListeners('date.formatted', dataStore.date.formatted);
    notifyListeners('device.greeting', dataStore.device.greeting);
};

const notifyListeners = (key: string, value: any) => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
        keyListeners.forEach((callback) => callback(value));
    }
};

// Start time updates
let timeInterval: ReturnType<typeof setInterval> | null = null;

export const startDataUpdates = () => {
    if (!timeInterval) {
        updateTime(); // Initial update
        timeInterval = setInterval(updateTime, 1000);
    }
};

export const stopDataUpdates = () => {
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
};

/**
 * Force-restart the timer. Use when returning from background
 * where the OS may have killed the JS interval silently.
 */
export const restartDataUpdates = () => {
    stopDataUpdates();
    startDataUpdates();
};

// ============================================
// Data Provider Implementation
// ============================================

export const dataProvider: DataProvider = {
    getValue(key: DataBindingKey): string | number | boolean {
        const [category, field] = key.split('.') as [keyof DataStore, string];
        const categoryData = dataStore[category] as Record<string, any>;
        return categoryData?.[field] ?? '';
    },

    subscribe(key: DataBindingKey, callback: (value: any) => void): () => void {
        if (!listeners.has(key)) {
            listeners.set(key, new Set());
        }
        listeners.get(key)!.add(callback);

        // Return unsubscribe function
        return () => {
            listeners.get(key)?.delete(callback);
        };
    },
};

// ============================================
// Parse Data Bindings in Text
// ============================================

export const parseDataBindings = (text: string): string => {
    const bindingRegex = /\{([^}]+)\}/g;
    return text.replace(bindingRegex, (match, key) => {
        const value = dataProvider.getValue(key as DataBindingKey);
        return value?.toString() ?? match;
    });
};

// ============================================
// Update Mock Data (for testing)
// ============================================

export const updateBattery = (level: number, isCharging = false) => {
    const icon = isCharging
        ? 'battery-charging'
        : level > 90
            ? 'battery'
            : level > 70
                ? 'battery-80'
                : level > 50
                    ? 'battery-60'
                    : level > 30
                        ? 'battery-40'
                        : level > 10
                            ? 'battery-20'
                            : 'battery-10';

    dataStore.battery = { level, isCharging, icon };
    notifyListeners('battery.level', level);
    notifyListeners('battery.isCharging', isCharging);
    notifyListeners('battery.icon', icon);
};

export const updateWeather = (temp: number, condition: string, high: number, low: number) => {
    const icons: Record<string, string> = {
        'sunny': 'weather-sunny',
        'cloudy': 'weather-cloudy',
        'partly cloudy': 'weather-partly-cloudy',
        'rainy': 'weather-rainy',
        'stormy': 'weather-lightning-rainy',
        'snowy': 'weather-snowy',
    };

    const icon = icons[condition.toLowerCase()] || 'weather-cloudy';
    dataStore.weather = { temp, condition, icon, high, low };
    notifyListeners('weather.temp', temp);
    notifyListeners('weather.condition', condition);
    notifyListeners('weather.icon', icon);
    notifyListeners('weather.high', high);
    notifyListeners('weather.low', low);
};

export const updateMusic = (title: string, artist: string, isPlaying: boolean, album: string = dataStore.music.album) => {
    dataStore.music = { ...dataStore.music, title, artist, isPlaying, album };
    notifyListeners('music.title', title);
    notifyListeners('music.artist', artist);
    notifyListeners('music.isPlaying', isPlaying);
    notifyListeners('music.album', album);
};

// Initialize with current time
updateTime();
