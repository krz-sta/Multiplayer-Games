import GamesList from "./GamesList"
import Header from "./Header"

function MainPage({ user }: any) {
    return (
        <>
            <div className="h-screen flex flex-col">
                <Header user={user}/>
                <GamesList />
            </div>
        </>
    )
}

export default MainPage