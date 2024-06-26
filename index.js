
const axios = require('axios');
const express = require('express');
const weathers = require('./constant');
const app = express();

app.use(express.json());

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_API_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const WEATHER_API_KEY = 'dfac0dbd0eb0cf0b42a15826819617ec';

const webhook = async (req, res) => {
    try {
        const city = req.body.city;
        console.log(req , "req");
        const endDate = new Date(req.body.date);
        const current_date = new Date();

        console.log("City:", city);
        console.log("End Date:", endDate , "" , endDate.getDate() , current_date.getDate());
        if (isNaN(endDate)) {
            const response = await axios.get(`${WEATHER_API_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
            const weatherInfo = response.data.main;
            console.log(weatherInfo);
            res.send(weatherInfo);
        } else {

            if (isNaN(current_date) || isNaN(endDate)) {
                return res.status(400).send('Invalid date format');
            }

            const response = await axios.get(`${WEATHER_API_FORECAST_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
        
            if (response.status !== 200) {
                console.error('Error response from weather API:', response.status, response.statusText);
                return res.status(500).send('Error fetching weather data');
            }

            const forecastData = response.data.list;
            console.log(forecastData, "forecastData");

            const aggregatedData = {};

            forecastData.forEach(item => {
                const itemDate = new Date(item.dt_txt.split(' ')[0]);
                if (itemDate >= current_date && itemDate <= endDate) {
                    const dateStr = item.dt_txt.split(' ')[0];
                    if (!aggregatedData[dateStr]) {
                        aggregatedData[dateStr] = {
                            date: dateStr,
                            temperatures: []
                        };
                    }
                    aggregatedData[dateStr].temperatures.push(item.main.temp);
                }
            });

            const result = Object.values(aggregatedData).map(day => {
                const avgTemp = day.temperatures.reduce((acc, curr) => acc + curr, 0) / day.temperatures.length;
                return {
                    date: day.date,
                    temperature: avgTemp
                };
            });

            if (result.length === 0) {
                console.log('No forecast data available for the specified date range');
                return res.status(404).send('No forecast data available for the specified date range');
            }
console.log(result , "result" ,weathers);
            res.send(result);
        }
    } catch (error) {
        console.error('Error in webhook:', error);
        res.status(500).send('Error processing request');
    }
};

app.post('/api/weather', webhook);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
