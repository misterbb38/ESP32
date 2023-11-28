// const express = require('express');
// const http = require('http');
// const socketIO = require('socket.io');
// const SerialPort = require('serialport');
// const Readline = require('@serialport/parser-readline');

// const app = express();
// const server = http.createServer(app);
// const io = socketIO(server);

// const port = 3000;

// // Функция для инициализации последовательного порта
// async function initSerialPort() {
//   try {
//     // Получить список доступных последовательных портов
//     const ports = await SerialPort.list();

//     // Поиск порта ESP32 в списке (настроить VID и PID согласно вашей ESP32)
//     const esp32Port = ports.find(port => port.vendorId === '10C4' && port.productId === 'EA60');

//     if (!esp32Port) {
//       throw new Error('ESP32 не найден. Пожалуйста, подключите устройство.');
//     }

//     // Создать последовательное соединение с ESP32
//     const esp32SerialPort = new SerialPort(esp32Port.path, { baudRate: 115200 });

//     // Использовать парсер readline для обработки данных построчно
//     const parser = esp32SerialPort.pipe(new Readline({ delimiter: '\r\n' }));

//     console.log('Соединение с ESP32 установлено успешно.');

//     // Слушать данные от ESP32 через последовательный порт
//     parser.on('data', (data) => {
//       const esp32Data = data.toString().trim();
//       console.log('Данные от ESP32:', esp32Data);

//       // Отправить данные всем подключенным клиентам через WebSocket
//       io.emit('esp32-data', esp32Data);
//     });

//   } catch (err) {
//     console.error('Ошибка подключения к последовательному порту:', err.message);

//     // Вывести сообщение о том, что устройство не подключено
//     console.log('Устройство не подключено. Пожалуйста, подключите устройство.');
//   }
// }

// // Инициализировать последовательный порт
// initSerialPort();

// // Предоставить простую HTML-страницу
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

// // Слушать подключения через WebSocket
// io.on('connection', (socket) => {
//   console.log('Новое подключение через WebSocket');
// });

// // Запустить сервер
// server.listen(port, () => {
//   console.log(`Сервер работает по адресу http://localhost:${port}`);
// });
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const BluetoothSerialPort = require('bluetooth-serial-port');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

// Функция для инициализации последовательного порта (для ESP32)
async function initSerialPort() {
  try {
    // Получаем список доступных последовательных портов
    const ports = await SerialPort.list();

    // Ищем порт ESP32 в списке (настроить VID и PID согласно вашей ESP32)
    const esp32Port = ports.find(port => port.vendorId === '10C4' && port.productId === 'EA60');

    if (!esp32Port) {
      throw new Error('ESP32 не найден. Пожалуйста, подключите устройство.');
    }

    // Создаем последовательное соединение с ESP32
    const esp32SerialPort = new SerialPort(esp32Port.path, { baudRate: 115200 });

    // Используем парсер readline для обработки данных построчно
    const parser = esp32SerialPort.pipe(new Readline({ delimiter: '\r\n' }));

    console.log('Соединение с ESP32 установлено успешно.');

    // Слушаем данные от ESP32 через последовательный порт
    parser.on('data', (data) => {
      const esp32Data = data.toString().trim();
      console.log('Данные от ESP32:', esp32Data);

      // Отправляем данные всем подключенным клиентам через WebSocket
      io.emit('esp32-data', esp32Data);
    });

  } catch (err) {
    console.error('Ошибка подключения к последовательному порту:', err.message);

    // Выводим сообщение о том, что устройство не подключено
    console.log('Устройство не подключено. Пожалуйста, подключите устройство.');
  }
}

// Функция для инициализации порта Bluetooth
function initBluetoothPort() {
  const btSerial = new BluetoothSerialPort.BluetoothSerialPort();

  btSerial.on('found', (address, name) => {
    btSerial.findSerialPortChannel(address, (channel) => {
      btSerial.connect(address, channel, () => {
        console.log('Соединение по Bluetooth установлено успешно.');

        btSerial.on('data', (buffer) => {
          const bluetoothData = buffer.toString('utf-8').trim();
          console.log('Данные от Bluetooth:', bluetoothData);
          io.emit('bluetooth-data', bluetoothData);
        });
      });
    });
  });

  btSerial.inquire();
}

// Инициализируем порт ESP32
initSerialPort();

// Инициализируем порт Bluetooth
initBluetoothPort();

// Предоставляем простую HTML-страницу
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Слушаем подключения через WebSocket
io.on('connection', (socket) => {
  console.log('Новое подключение через WebSocket');
});

// Запускаем сервер
server.listen(port, () => {
  console.log(`Сервер работает по адресу http://localhost:${port}`);
});
