let lastWeatherText = "";
let chart;

/* CORE WEATHER FETCH */
async function fetchWeather(lat, lon, placeName, country, timezone) {
    const resultDiv = document.getElementById("weather-result");

    try {
        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}` +
            `&longitude=${lon}` +
            `&hourly=temperature_2m,apparent_temperature` +
            `&daily=temperature_2m_max,precipitation_sum` +
            `&forecast_days=1` +
            `&timezone=${timezone}`;

        const res = await fetch(url);
        const data = await res.json();

        const temp = data.daily.temperature_2m_max[0];
        const feels = data.hourly.apparent_temperature[0];
        const rain = data.daily.precipitation_sum[0];

        let emoji = "🌤";
        if (rain > 5) emoji = "🌧";
        else if (temp > 30) emoji = "🔥";
        else if (temp < 15) emoji = "❄";

        const localTime = new Date().toLocaleString("en-IN", {
            timeZone: timezone
        });

        lastWeatherText =
            `The temperature in ${placeName} is ${temp} degrees Celsius. ` +
            `It feels like ${feels} degrees.`;

        resultDiv.innerHTML = `
            <h3>${emoji} ${placeName}${country ? ", " + country : ""}</h3>
            <p>🕒 Local Time: ${localTime}</p>
            <p>🌡 Temperature: <b>${temp} °C</b></p>
            <p>🤔 Feels like: <b>${feels} °C</b></p>
            <p>🌧 Rainfall: <b>${rain} mm</b></p>
        `;

        drawChart(data.hourly.temperature_2m);

    } catch (err) {
        resultDiv.innerHTML = "⚠️ Error fetching weather data";
        console.error(err);
    }
}

/* HOURLY CHART */
function drawChart(temps) {
    const ctx = document.getElementById("tempChart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: temps.map((_, i) => i + "h"),
            datasets: [{
                label: "Hourly Temperature (°C)",
                data: temps,
                tension: 0.3
            }]
        }
    });
}

/* CITY SEARCH */
async function getWeather() {
    const city = document.getElementById("city").value;
    const resultDiv = document.getElementById("weather-result");

    if (!city) {
        resultDiv.innerHTML = "❌ Please enter a city name";
        return;
    }

    try {
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
        );
        const geoData = await geoRes.json();

        if (!geoData.results) {
            resultDiv.innerHTML = "❌ City not found";
            return;
        }

        const g = geoData.results[0];

        fetchWeather(
            g.latitude,
            g.longitude,
            g.name,
            g.country,
            g.timezone || "Asia/Kolkata"
        );

    } catch (err) {
        resultDiv.innerHTML = "⚠️ Error finding city";
    }
}

/* AUTO LOCATION */
function getLocationWeather() {
    navigator.geolocation.getCurrentPosition(
        pos => {
            fetchWeather(
                pos.coords.latitude,
                pos.coords.longitude,
                "Your Location",
                "",
                "Asia/Kolkata"
            );
        },
        () => {
            document.getElementById("weather-result").innerHTML =
                "❌ Location access denied";
        }
    );
}

/* DARK / LIGHT MODE */
function toggleMode() {
    document.body.classList.toggle("light-mode");
}

/* VOICE READOUT */
function speakWeather() {
    if (!lastWeatherText) return;
    const msg = new SpeechSynthesisUtterance(lastWeatherText);
    speechSynthesis.speak(msg);
}
