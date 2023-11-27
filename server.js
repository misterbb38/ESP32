const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

// Функция для инициализации последовательного порта
async function initSerialPort() {
  try {
    // Получить список доступных последовательных портов
    const ports = await SerialPort.list();

    // Поиск порта ESP32 в списке (настроить VID и PID согласно вашей ESP32)
    const esp32Port = ports.find(port => port.vendorId === '10C4' && port.productId === 'EA60');

    if (!esp32Port) {
      throw new Error('ESP32 не найден. Пожалуйста, подключите устройство.');
    }

    // Создать последовательное соединение с ESP32
    const esp32SerialPort = new SerialPort(esp32Port.path, { baudRate: 115200 });

    // Использовать парсер readline для обработки данных построчно
    const parser = esp32SerialPort.pipe(new Readline({ delimiter: '\r\n' }));

    console.log('Соединение с ESP32 установлено успешно.');

    // Слушать данные от ESP32 через последовательный порт
    parser.on('data', (data) => {
      const esp32Data = data.toString().trim();
      console.log('Данные от ESP32:', esp32Data);

      // Отправить данные всем подключенным клиентам через WebSocket
      io.emit('esp32-data', esp32Data);
    });

  } catch (err) {
    console.error('Ошибка подключения к последовательному порту:', err.message);

    // Вывести сообщение о том, что устройство не подключено
    console.log('Устройство не подключено. Пожалуйста, подключите устройство.');
  }
}

// Инициализировать последовательный порт
initSerialPort();

// Предоставить простую HTML-страницу
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Слушать подключения через WebSocket
io.on('connection', (socket) => {
  console.log('Новое подключение через WebSocket');
});

// Запустить сервер
server.listen(port, () => {
  console.log(`Сервер работает по адресу http://localhost:${port}`);
});
