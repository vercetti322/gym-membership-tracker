// src/App.tsx
import './App.css';
import MemberList from './components/MemberList';

function App() {
  return (
    <div className="main-app">
      <h1>Power Bull Gym</h1>
      <p>Track members, renewals and payments in one place.</p>
      <div className="action-btns">
        <button>New Member</button>
        <button>Payments Due</button>
      </div>
      <MemberList />
    </div>
  );
}

export default App;
