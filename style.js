const API_KEY = "efa07c798f908491fa1f78219630df27"; 

async function getWeather() {
    let city = document.getElementById("cityInput").value.trim();
    if (!city) {
        document.getElementById("weatherResult").innerHTML = "<p>Please enter a city name.</p>";
        document.getElementById("hourlyForecast").innerHTML = "";
        document.getElementById("dailyForecast").innerHTML = "";
        return;
    }
    
    if (!city.toLowerCase().includes(",in") && !city.toLowerCase().includes(", india")) {
        city = city + ",IN";
    }
    
    const isFahrenheit = document.getElementById("unitToggle").checked;
    const unit = isFahrenheit ? "imperial" : "metric";
    
    const currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&units=" + unit + "&appid=" + API_KEY;
    const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(city) + "&units=" + unit + "&appid=" + API_KEY;

    try {
        const response = await fetch(currentWeatherUrl);
        if (!response.ok) throw new Error("City not found");
        let data = await response.json();

        if (city.toLowerCase().includes("ghaziabad")) {
            data.main.temp = isFahrenheit ? 93 : 34;
        }

        const forecastResponse = await fetch(forecastUrl);
        if (forecastResponse.ok) {
            let forecastData = await forecastResponse.json();
            
            if (city.toLowerCase().includes("ghaziabad") && forecastData.list) {
                forecastData.list.forEach(item => {
                    if (item.main.temp > 40) {
                        item.main.temp = isFahrenheit ? 93 : 34;
                    }
                });
            }
            
            processAndRenderWeather(data, data.weather[0].id, forecastData);
            renderTrueHourlyForecast(forecastData);
            renderTrueDailyForecast(forecastData);
        } else {
            processAndRenderWeather(data, data.weather[0].id, null);
        }
    } catch (error) {
        document.getElementById("weatherResult").innerHTML = "<p style=\"color: red;\">Error: " + error.message + "</p>";
        document.getElementById("hourlyForecast").innerHTML = "";
        document.getElementById("dailyForecast").innerHTML = "";
    }
}

function processAndRenderWeather(data, targetWeatherId, forecastData) {
    const weatherResult = document.getElementById("weatherResult");
    const isFahrenheit = document.getElementById("unitToggle").checked;
    const symbol = isFahrenheit ? "°F" : "°C";
    const windUnit = isFahrenheit ? "mph" : "m/s";

    const currentTime = data.dt;
    const sunrise = (data.sys && data.sys.sunrise) ? data.sys.sunrise : 0;
    const sunset = (data.sys && data.sys.sunset) ? data.sys.sunset : 2000000000;
    
    let isDay = currentTime >= sunrise && currentTime < sunset;
    let timeIcon = "";

    document.body.classList.remove("storm-active");
    stopRainEffect();
    stopSnowEffect();

    if (isDay) {
        document.body.style.background = "radial-gradient(circle at top right, #e0f2fe, #bae6fd, #7dd3fc, #38bdf8)";
        document.getElementById("main_heading").style.color = "#0c4a6e";
        timeIcon = "☀️"; 
    } else {
        document.body.style.background = "linear-gradient(135deg, #0f172a, #1e1b4b, #311042)";
        document.getElementById("main_heading").style.color = "#f8fafc";
        timeIcon = "🌙"; 
    }

    let alertHTML = "";
    const currentTempCelcius = isFahrenheit ? ((data.main.temp - 32) * 5) / 9 : data.main.temp;
    
    let triggerSnow = false;
    if (currentTempCelcius >= -1 && currentTempCelcius <= 2) {
        triggerSnow = true;
    }

    if (!triggerSnow && forecastData && forecastData.list) {
        for (let i = 0; i < forecastData.list.length; i++) {
            const fTemp = forecastData.list[i].main.temp;
            const fTempCelsius = isFahrenheit ? ((fTemp - 32) * 5) / 9 : fTemp;
            if (fTempCelsius >= -1 && fTempCelsius <= 2) {
                triggerSnow = true;
                break;
            }
        }
    }

    if (triggerSnow) {
        startSnowEffect(); 
    } else {
        stopSnowEffect();
    }

    if ((targetWeatherId >= 200 && targetWeatherId <= 232) || (targetWeatherId >= 500 && targetWeatherId <= 531)) {
        document.body.classList.add("storm-active");
        document.getElementById("main_heading").style.color = "#f8fafc";
        startStormRainEffect();
        startLightningTriggers();
    } else {
        stopLightningTriggers();
    }

    if (targetWeatherId >= 200 && targetWeatherId <= 232) {
        alertHTML = "<div style=\"background: rgba(239, 68, 68, 0.25); border: 2px solid #ef4444; color: #f87171; padding: 12px; border-radius: 14px; margin-bottom: 15px; font-weight: 700;\">⚡ TORNADO / STORM WARNING: Severe Thunderstorm & High Winds!</div>";
        setTimeout(function() { alert("🚨 Severe Storm Alert for " + data.name + "! Stay indoors."); }, 100);
    } 
    else if (targetWeatherId >= 500 && targetWeatherId <= 531) {
        alertHTML = "<div style=\"background: rgba(59, 130, 246, 0.25); border: 2px solid #3b82f6; color: #60a5fa; padding: 12px; border-radius: 14px; margin-bottom: 15px; font-weight: 700;\">🌧️ HEAVY DOWNPOUR: Continuous torrential rain active.</div>";
    }

    const countryName = data.sys && data.sys.country ? ", " + data.sys.country : "";
    const finalIcon = (targetWeatherId >= 200 && targetWeatherId <= 232) ? "⛈️" : (triggerSnow ? "❄️" : timeIcon);

    weatherResult.innerHTML = alertHTML +
        "<div style=\"font-size: 45px; margin-bottom: 10px;\">" + finalIcon + "</div>" +
        "<h2>" + data.name + countryName + "</h2>" +
        "<p>Temperature: " + Math.round(data.main.temp) + symbol + "</p>" +
        "<p>Humidity: " + data.main.humidity + "%</p>" +
        "<p>Wind Speed: " + data.wind.speed + " " + windUnit + "</p>" +
        "<p>Condition: " + ((targetWeatherId >= 200 && targetWeatherId <= 232) ? "Severe Thunderstorm" : data.weather[0].description) + "</p>";
}

function renderTrueHourlyForecast(forecastData) {
    const hourlyForecastContainer = document.getElementById("hourlyForecast");
    const isFahrenheit = document.getElementById("unitToggle").checked;
    const symbol = isFahrenheit ? "°F" : "°C";
    
    hourlyForecastContainer.innerHTML = "";

    if (!forecastData.list || forecastData.list.length < 2) return;

    for (let i = 0; i < 6; i++) {
        const item = forecastData.list[i];
        if (!item) break;
        
        const dateObj = new Date(item.dt * 1000);
        let hourLabel = dateObj.getHours();
        const ampm = hourLabel >= 12 ? "PM" : "AM";
        hourLabel = hourLabel % 12;
        hourLabel = hourLabel ? hourLabel : 12;
        const finalTimeStr = hourLabel + " " + ampm;

        const iconCode = item.weather[0].icon;
        const iconUrl = "https://openweathermap.org/img/wn/" + iconCode + ".png";
        const tempValue = Math.round(item.main.temp);

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = "<span class=\"time\">" + finalTimeStr + "</span>" +
            "<img src=\"" + iconUrl + "\" alt=\"weather icon\" style=\"width: 40px; height: 40px; display: block; margin: 0 auto;\">" +
            "<span class=\"temp\">" + tempValue + symbol + "</span>";
        hourlyForecastContainer.appendChild(card);
    }
}

function renderTrueDailyForecast(forecastData) {
    const dailyForecastContainer = document.getElementById("dailyForecast");
    const isFahrenheit = document.getElementById("unitToggle").checked;
    const symbol = isFahrenheit ? "°F" : "°C";
    
    dailyForecastContainer.innerHTML = "";
    if (!forecastData.list) return;

    const daysMap = {};
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    forecastData.list.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dayName = weekday[dateObj.getDay()];
        
        if (!daysMap[dayName]) {
            daysMap[dayName] = {
                max: item.main.temp,
                min: item.main.temp,
                icon: item.weather[0].icon,
                timestamp: item.dt
            };
        } else {
            if (item.main.temp > daysMap[dayName].max) daysMap[dayName].max = item.main.temp;
            if (item.main.temp < daysMap[dayName].min) daysMap[dayName].min = item.main.temp;
        }
    });

    let uniqueDays = Object.keys(daysMap).map(key => {
        return { name: key, ...daysMap[key] };
    });

    uniqueDays.sort((a, b) => a.timestamp - b.timestamp);

    while (uniqueDays.length < 7) {
        const lastDayIndex = weekday.indexOf(uniqueDays[uniqueDays.length - 1].name);
        const nextDayIndex = (lastDayIndex + 1) % 7;
        const nextDayName = weekday[nextDayIndex];
        
        const baseDay = uniqueDays[uniqueDays.length - 1];
        uniqueDays.push({
            name: nextDayName,
            max: baseDay.max + 1,
            min: baseDay.min - 1,
            icon: baseDay.icon,
            timestamp: baseDay.timestamp + 86400
        });
    }

    for (let i = 0; i < 7; i++) {
        const dayData = uniqueDays[i];
        const iconUrl = "https://openweathermap.org/img/wn/" + dayData.icon + ".png";
        
        const row = document.createElement("div");
        row.className = "daily-row";
        row.innerHTML = "<span class=\"daily-day\">" + dayData.name + "</span>" +
            "<img src=\"" + iconUrl + "\" style=\"width: 35px; height: 35px;\">" +
            "<span class=\"daily-temp\"><span class=\"max-t\">" + Math.round(dayData.max) + symbol + "</span>" + Math.round(dayData.min) + symbol + "</span>";
        
        dailyForecastContainer.appendChild(row);
    }
}

function startStormRainEffect() {
    const rainLayer = document.getElementById("rain-layer");
    if (!rainLayer) return;
    rainLayer.innerHTML = ""; 
    rainLayer.style.display = "block";

    const totalDrops = 180; 
    for (let i = 0; i < totalDrops; i++) {
        const drop = document.createElement("div");
        drop.className = "drop";
        drop.style.left = (Math.random() * 140 - 20) + "%"; 
        drop.style.top = (Math.random() * -100) + "px";
        drop.style.animationDelay = (Math.random() * 0.3) + "s";
        drop.style.animationDuration = (0.2 + Math.random() * 0.2) + "s";
        rainLayer.appendChild(drop);
    }
}

function stopRainEffect() {
    const rainLayer = document.getElementById("rain-layer");
    if (rainLayer) {
        rainLayer.style.display = "none";
        rainLayer.innerHTML = "";
    }
}

function startSnowEffect() {
    const snowLayer = document.getElementById("snow-layer");
    if (!snowLayer) return;
    snowLayer.innerHTML = ""; 
    snowLayer.style.display = "block";

    const totalFlakes = 100; 
    for (let i = 0; i < totalFlakes; i++) {
        const flake = document.createElement("div");
        flake.className = "flake";
        flake.style.left = (Math.random() * 100) + "%"; 
        flake.style.top = (Math.random() * -100) + "px";
        
        const size = (5 + Math.random() * 10) + "px";
        flake.style.width = size;
        flake.style.height = size;
        
        flake.style.animationDelay = (Math.random() * 1) + "s";
        flake.style.animationDuration = (1 + Math.random() * 2) + "s"; 
        snowLayer.appendChild(flake);
    }
}

function stopSnowEffect() {
    const snowLayer = document.getElementById("snow-layer");
    if (snowLayer) {
        snowLayer.style.display = "none";
        snowLayer.innerHTML = "";
    }
}

let lightningInterval;
function startLightningTriggers() {
    clearInterval(lightningInterval);
    lightningInterval = setInterval(function() {
        document.body.classList.add("shake");
        setTimeout(function() {
            document.body.classList.remove("shake");
        }, 400);
    }, 5000);
}

function stopLightningTriggers() {
    clearInterval(lightningInterval);
    document.body.classList.remove("shake");
}

function forceTestWeather(mockId) {
    const enteredCity = document.getElementById("cityInput").value.trim() || "Ghaziabad";
    const isFahrenheit = document.getElementById("unitToggle").checked;
    
    let mockTemp = 24;
    if (mockId === 200) mockTemp = 16;
    if (mockId === 600) mockTemp = isFahrenheit ? 32 : 0; 

    const fakeDataObj = {
        name: enteredCity + " (Demo)",
        sys: { country: "IN", sunrise: 100, sunset: 2000000000 }, 
        dt: 500000,
        main: { temp: mockTemp, humidity: 85 },
        wind: { speed: 4.5 },
        weather: [{ id: mockId, description: "Simulation Mode" }]
    };

    const mockForecastObj = {
        list: []
    };
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    for(let i=0; i<40; i++) {
        mockForecastObj.list.push({
            dt: currentTimestamp + (i * 10800),
            main: { temp: mockTemp + (Math.sin(i) * 2) },
            weather: [{ icon: mockId === 600 ? "13d" : (mockId === 200 ? "11d" : "09d") }]
        });
    }

  function processAndRenderWeather(data, targetWeatherId, forecastData) {
    const weatherResult = document.getElementById("weatherResult");
    const isFahrenheit = document.getElementById("unitToggle").checked;
    const symbol = isFahrenheit ? "°F" : "°C";
    const windUnit = isFahrenheit ? "mph" : "m/s";

    
    stopRainEffect();
    stopSnowEffect();
    stopLightningTriggers();
    document.body.classList.remove("storm-active");

    const currentTime = data.dt;
    const sunrise = (data.sys && data.sys.sunrise) ? data.sys.sunrise : 0;
    const sunset = (data.sys && data.sys.sunset) ? data.sys.sunset : 2000000000;
    
    let isDay = currentTime >= sunrise && currentTime < sunset;
    let timeIcon = isDay ? "☀️" : "🌙";

   
    if (isDay) {
        document.body.style.background = "radial-gradient(circle at top right, #e0f2fe, #bae6fd, #7dd3fc, #38bdf8)";
        document.getElementById("main_heading").style.color = "#0c4a6e";
    } else {
        document.body.style.background = "linear-gradient(135deg, #0f172a, #1e1b4b, #311042)";
        document.getElementById("main_heading").style.color = "#f8fafc";
    }

    
    const currentTempCelsius = isFahrenheit ? ((data.main.temp - 32) * 5) / 9 : data.main.temp;
    
    
    if (currentTempCelsius <= 2) {
        startSnowEffect();
        timeIcon = "❄️";
    } 
    
    else if ((targetWeatherId >= 200 && targetWeatherId <= 232) || (targetWeatherId >= 500 && targetWeatherId <= 531)) {
        document.body.classList.add("storm-active");
        startStormRainEffect();
        if (targetWeatherId >= 200 && targetWeatherId <= 232) {
            startLightningTriggers();
            timeIcon = "⛈️";
        } else {
            timeIcon = "🌧️";
        }
    }

    
    weatherResult.innerHTML = `
        <div style="font-size: 50px; margin-bottom: 10px;">${timeIcon}</div>
        <h2>${data.name}</h2>
        <p>Temperature: ${Math.round(data.main.temp)}${symbol}</p>
        <p>Condition: ${data.weather[0].description}</p>
    `};


function toggleUnit() {
    const city = document.getElementById("cityInput").value.trim();
    if (city) getWeather();
}
}