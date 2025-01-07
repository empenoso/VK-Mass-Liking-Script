/**
 * Получение токена доступа для VK API 🔑
 * 
 *  Этот скрипт запрашивает токен доступа для взаимодействия с VK API.
 *  Он используется для автоматизации лайков на посты друзей.
 * 
 *  ⚠️ Не сохраняйте токен в открытом виде. Храните его в безопасном месте.
 *
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * @version 1.0
 * @since 2025-01-08
 */

// node "d:\SynologyDrive\docs\2025_01_VK-Mass-Liking-Script\gettingAccessToken.mjs"

// Импортируем необходимые библиотеки
import { CallbackService } from 'vk-io';
import { DirectAuthorization, officialAppCredentials } from '@vk-io/authorization';
import readline from 'readline';
import credentials from './secret/credentials.js';
import * as fs from 'fs'; 
import { fileURLToPath } from 'url';
import path from 'path';

// Настраиваем интерфейс для чтения данных из консоли
const readLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Создаем экземпляр CallbackService для обработки событий
const callbackService = new CallbackService();

// Обрабатываем двухфакторную авторизацию
callbackService.onTwoFactor((payload, retry) => {
    console.log('Требуется двухфакторная авторизация.');
    readLine.question('Введите код двухфакторной авторизации: ', (answer) => {
        retry(answer)
            .then(() => {
                console.log('Двухфакторная авторизация успешно завершена.');
            })
            .catch((error) => {
                console.error('Ошибка двухфакторной авторизации:', error.message);
            });
    });
});

// Создаем экземпляр DirectAuthorization для выполнения авторизации
const direct = new DirectAuthorization({
    callbackService,
    ...officialAppCredentials.android, // Используем официальные учетные данные приложения для Android
    scope: 'all', // Все разрешения
    login: credentials.login, // Логин из файла
    password: credentials.password, // Пароль из файла
    apiVersion: '5.199' // Версия API ВКонтакте
});

(async () => {
    try {
        console.log('Начинаем процесс авторизации...');

        // Выполняем авторизацию и получаем токен
        const response = await direct.run();

        console.log('Авторизация успешно завершена!');
        console.log('Токен:', response.token);
        console.log('Срок действия токена:', response.expires);
        console.log('Email:', response.email);
        console.log('ID пользователя:', response.userId);


        // Сохранить токен в файле (например, credentials.json):
        const __filename = fileURLToPath(import.meta.url);  // Получить имя файла
        const __dirname = path.dirname(__filename);        // Получить имя каталога
        const credentialsFile = path.join(__dirname, 'secret', 'credentials.json'); 
        const credentialsData = {
            accessToken: response.token,
            expires: response.expires,
            userId: response.userId,
            email: response.email 
        };

        fs.writeFileSync(credentialsFile, JSON.stringify(credentialsData, null, 2)); 

        console.log(`Токен сохранен в ${credentialsFile}`);

    } catch (error) {
        console.error('Произошла ошибка во время авторизации:', error.message);
    } finally {
        readLine.close();
    }
})();
