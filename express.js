const express = require('express');

const app = express();

const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.get('/bestProducts', (req, res) => {
    res.sendFile(path.join(__dirname, 'page', 'bestProducts.html'));
})

app.get('/about', (req, res) => {
    res.send('Сторінка про нас');
})

// app.use((req, res) => {
//     res.status(404).send('Сторінка не знайдена');
// })

app.listen(port, () => {
    console.log('Server started')
})