import React from "react";

// const src = "Аменхотеп\tcitizen\tFALSE\n" +
//   "Бровар\tdon\tTRUE\n" +
//   "Желтый\tsheriff\tFALSE\n" +
//   "Иви\tcitizen\tFALSE\n" +
//   "Йода\tcitizen\tFALSE\n" +
//   "Свитс\tmafia\tTRUE\n" +
//   "Самса\tcitizen\tFALSE\n" +
//   "Тайна\tcitizen\tFALSE\n" +
//   "Физрук\tcitizen\tFALSE\n" +
//   "Лирика\tmafia\tTRUE";

const formatRows = (src) => {
  const result = {
    date: '13-07-2021',
    win: 'city',
    players: [],
  };
  const rows = src.split('\n');
  rows.forEach(row => {
    const data = row.split('\t');
    if (data[1] === 'don' && data[2] === 'TRUE') {
      result.win = 'mafia';
    }
    result.players.push({
      name: data[0],
      role: data[1],
      win: data[2] === 'TRUE',
    })
  });
  return result;
}

class Converter extends React.Component {
  state = {
    games: [],
  }

  onAdd = () => {
    const ta = document.querySelector('#new');
    const src = ta.value;
    console.error(src);
    const formatted = formatRows(src);
    this.setState(state => {
      const games = [...state.games];
      games.push(formatted);
      return {
        games,
      }
    });
    ta.value = "";
  }

  render() {
    return (
      <div className="App">
        <textarea name="" id="new" cols="30" rows="10"></textarea>
        <button onClick={this.onAdd}>Add</button>
        <pre>
        {JSON.stringify(this.state.games, null, 2)}
      </pre>
      </div>
    );
  }
}

export default Converter;
