"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface MessageType {
    name : string
    message : string
}

export default function ChatRoomPage() {
    const { room_id } = useParams()
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...")
    const [nameInput, changeNameInput] = useState<string>("")
    const [messageInput, changeMessageInput] = useState<string>("")


    function handleSubmit() {
        async function sendMessage() {

            if (!(messageInput) || !(nameInput)) {
                return
            }
        
            const messageObject = {
                "name" : nameInput, 
                "message" : messageInput
            }

            try {
                const res = await fetch(`http://127.0.0.1:8000/api/v1/chat_room/${room_id}/send_message`, {
                    method: "POST",
                    body: JSON.stringify(messageObject),
                    headers: {
                        "Content-Type" : "application/json"
                    }
                })
                changeMessageInput("")
            } catch {
                console.error("Error sending message, try again")
            }
        }

        sendMessage()
    }

    useEffect(() => {
        async function checkRoomExists() {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/v1/chat_room/${room_id}`)
                const data = await res.json()
                
                console.log("Room exists" + data['result'])
                if (!data['result']) {
                    setConnectionStatus("Room does not exist")
                }
            } catch {
                setConnectionStatus("Connection Error!!!!")
            }
        }

        checkRoomExists()
    }, [])

    useEffect(() => {
        console.log(messages)
    }, [messages])
    
    useEffect(() => {
        const websocket = new WebSocket(`ws://localhost:8000/api/v1/chat_room/ws/connect/${room_id}`);
        
        websocket.onopen = () => {
            setConnectionStatus("Connected to chat room")
            console.log('WebSocket connection established');
        };
        
        websocket.onmessage = (event) => {
            setConnectionStatus("Received a new message!")
            const newMessage = JSON.parse(event.data);
            console.log(`Received a new message: ${newMessage}`)
            setMessages(prevMessages => [...prevMessages, newMessage])
            setConnectionStatus("Connected to chat room")
        };
        
        websocket.onclose = () => {
            setConnectionStatus("Connection Closed")
            console.log('WebSocket connection closed');
        };
        
        return () => {
            websocket.close();
        };
    }, [room_id]);

    //   useEffect(() => {
    //     console.log(messages)
    //   }, [messages])

    return (
        <div>
        <h1>Chat Room {room_id}</h1>
        <h3>{connectionStatus}</h3>
        {connectionStatus == "Connected to chat room" &&
            <>
                <p>Send As</p>
                <input className='text-black' value={nameInput} onChange={e => changeNameInput(e.target.value)}/>
                <br />
                <p>Message</p>
                <input className='text-black' value={messageInput} onChange={e => changeMessageInput(e.target.value)}/>
                <br />
                <button type="submit" onClick={handleSubmit}> Send Message </button>
            </>
        }
        <ul>
            {messages.map((message_obj, index) => (
                <li key={index}>{`${message_obj.name} : ${message_obj.message}`}</li>
            ))}
        </ul>
        </div>
  );
}
