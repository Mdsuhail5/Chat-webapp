import axios from "axios";

export const fetchMessages = async (chatId: string) => {
    const res = await axios.get(
        `http://localhost:3000/messages?chatId=${chatId}`
    );
    return res.data;
};