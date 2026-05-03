import axios from "axios";

export const fetchChats = async () => {
    const res = await axios.get("http://localhost:3000/chats");
    return res.data;
};