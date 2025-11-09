// script.js (ブラウザ側ロジック)

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM要素の取得
    const langSelectContainer = document.getElementById('language-select-container');
    const langButtons = document.querySelectorAll('.lang-button');
    const chatBox = document.getElementById('chat-box');
    const inputContainer = document.getElementById('input-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const loadingIndicator = document.getElementById('loading');
    
    // 状態管理変数
    let currentLanguage = null; 

    // 🏨 施設リストを削除 
    // const facilitiesList = [ ... ]; // ⬅️ この変数は削除します

    // 🚨 RAGプロキシサーバーのURL (サーバーのポートに合わせて変更してください) 🚨
    const PROXY_SERVER_URL = 'https://sakura-jimbocho-chatbot-rag-server.onrender.com/rag-chat';

    // メッセージをチャットボックスに追加する関数
    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // ⭐️ RAGプロキシサーバーを呼び出す関数 ⭐️
    async function getBotResponse(userMessage) {
        if (!currentLanguage) return; 

        loadingIndicator.style.display = 'block';
        sendBtn.disabled = true;
        
        try {
            const response = await fetch(PROXY_SERVER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // サーバーに送るデータ（メッセージと言語のみ）
                body: JSON.stringify({
                    userMessage: userMessage,
                    lang: currentLanguage,
                    // facilitiesList: facilitiesList, ⬅️ 施設リストの送信を削除
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`サーバーからのエラー: ${response.status} - ${errorData.error}`);
            }

            const data = await response.json();
            const botResponse = data.botResponse; 
            
            appendMessage('bot', botResponse);

        } catch (error) {
            console.error('Fetch error:', error);
            const errorMessage = error.message.includes('Failed to fetch') 
                ? "サーバーに接続できませんでした。RAGサーバーが起動しているか確認してください (http://localhost:3000)"
                : error.message;

            if (currentLanguage === 'ja') {
                 appendMessage('bot', `エラーが発生しました: ${errorMessage}。`);
            } else {
                 appendMessage('bot', `An error occurred: ${errorMessage}.`);
            }
        } finally {
            loadingIndicator.style.display = 'none';
            sendBtn.disabled = false;
        }
    }

    // 送信ボタンクリックまたはEnterキー押下時の処理
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('user', message);
        userInput.value = '';
        
        await getBotResponse(message);
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // ------------------------------------------
    // 言語選択ボタンのイベントリスナー
    // ------------------------------------------
    console.log('言語ボタンの数（要確認: 2であるべき）:', langButtons.length); 

    langButtons.forEach(button => {
        console.log(`ボタンにイベントを登録中: ${button.textContent}`); 

        button.addEventListener('click', (e) => {
            
            const selectedLang = e.target.getAttribute('data-lang');
            console.log('✅ クリックイベント発火！選択言語:', selectedLang);

            currentLanguage = selectedLang;
            
            // UIを切り替え
            langSelectContainer.style.display = 'none';
            chatBox.style.display = 'block';
            inputContainer.style.display = 'flex';
            
            // 初期のボットメッセージを言語に応じて表示
            if (currentLanguage === 'ja') {
                userInput.placeholder = "質問を入力してください...";
                sendBtn.textContent = "送信";
                appendMessage('bot', 'いらっしゃいませ。当ホテル周辺のおすすめ施設についてご質問ください。最新の情報とホテルの推奨リストに基づいてお答えします。');
            } else if (currentLanguage === 'en') {
                userInput.placeholder = "Enter your question...";
                sendBtn.textContent = "Send";
                appendMessage('bot', 'Welcome. Please ask me about recommended facilities around the hotel. I can provide information based on the hotel\'s list and up-to-date search results.');
            }
        });
    });

    // 初期状態ではチャットUIを非表示にしておく
    chatBox.style.display = 'none';
    inputContainer.style.display = 'none';
});