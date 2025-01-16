/**
 * Скрипт для автоматического лайкинга последних постов друзей ВКонтакте 👍
 * 
 * Этот скрипт автоматически ставит лайки на последние два поста ваших друзей в ВКонтакте.
 * Используйте с осторожностью, соблюдайте лимиты запросов API ВКонтакте и не злоупотребляйте автоматизацией.
 * 
 * Подробное описание: https://habr.com/ru/articles/871966/
 *
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * @version 1.1
 * @since 2025-01-08
 */

const {
    VK
} = require('vk-io');
const fs = require('fs');
const readline = require('readline'); // Для ожидания реакции пользователя

const credentialsFile = './secret/credentials.json';
const credentialsData = JSON.parse(fs.readFileSync(credentialsFile, 'utf-8'));

const vk = new VK({
    token: credentialsData.accessToken // Ваш токен доступа из файла 
});

async function likeLastPosts() {
    const {
        default: delay
    } = await import('delay');

    try {
        // Получаем список всех друзей
        const friends = await vk.api.friends.get({
            fields: 'nickname', // Необязательно, но может быть полезно для вывода
            order: 'hints' // hints - рекомендуемые друзья, name - по алфавиту. Можно убрать, тогда будет в порядке по умолчанию.
        });
        const friendIds = friends.items.map(friend => friend.id);

        console.log(`Найдено ${friendIds.length} друзей.`);

        const [me] = await vk.api.users.get({});
        console.log(`Мой ID: https://vk.com/id${me.id}`);

        let actionCounter = 1; // Инициализируем счетчик действий
        let likeCounter = 0;

        for (const friendId of friendIds) {
            try {
                // Получаем два последних поста друга
                const wall = await vk.api.wall.get({
                    owner_id: friendId,
                    count: 2 // Загружаем два последних поста
                });

                if (wall.items.length > 0) {
                    for (const post of wall.items) { // Проходим по каждому посту из выборки

                        // Проверяем, лайкали ли мы уже этот пост
                        const likes = await vk.api.likes.getList({
                            type: 'post',
                            owner_id: post.owner_id,
                            item_id: post.id,
                            filter: 'likes'
                        });

                        if (!likes.items.includes(me.id)) { // Проверяем наличие текущего userId в списке лайкнувших
                            // Ставим лайк
                            await vk.api.likes.add({
                                type: 'post',
                                owner_id: post.owner_id,
                                item_id: post.id
                            });
                            console.log(`${actionCounter} из ${friendIds.length}: поставил лайк на пост https://vk.com/id${friendId}?w=wall${friendId}_${post.id} 👍`);
                            likeCounter++;
                        } else {
                            console.log(`${actionCounter} из ${friendIds.length}: пост https://vk.com/id${friendId}?w=wall${friendId}_${post.id} уже лайкнут`);
                        }
                    }
                } else {
                    console.log(`${actionCounter} из ${friendIds.length}: у друга https://vk.com/id${friendId} нет постов.`);
                }

                actionCounter++;

                // Задержка для предотвращения бана
                await delay(1200); // 1200мс = 2 секунды,  60000мс / 50 запросов = 1200мс на запрос

            } catch (error) {
                console.error(`Ошибка обработки друга ${friendId}:`, error);
            }
        }

        console.log(`\nПроставлено лайков: ${likeCounter}, а всего в списке было ${friendIds.length} друзей.`);

        // Ожидание реакции пользователя перед завершением
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Нажмите любую клавишу, чтобы выйти...\n', () => {
            rl.close();
        });

    } catch (error) {
        console.error('Глобальная ошибка:', error);
    }
}

likeLastPosts();