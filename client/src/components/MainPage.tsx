import FriendsList from "./FriendsList";
import GamesList from "./GamesList"
import Header from "./Header"
import { useState } from "react"

function MainPage({ user }: any) {
    const [activeTab, setActiveTab] = useState('games');
    return (
        <>
            <div className="h-screen flex flex-col">
                <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab}/>
                {activeTab === 'games' ? <GamesList /> : ''}
                {activeTab === 'friends' ? <FriendsList user={user}/> : ''}
            </div>
        </>
    )
}

export default MainPage