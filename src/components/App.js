import _ from 'lodash';
import React from "react";
import block from 'bem-cn';
import moment from "moment";
import 'moment/locale/ru';
import log from '../static/gameHistory';
import {roles, translateRole} from '../static/statics';
import './app.css';

const b = block('app');

moment.locale('ru');

const getRate = (full = 1, value = 0) => parseFloat(((value * 100) / full).toFixed(1));
const dateFormat = "DD-MM-YYYY";
const getRoleBackground = role => {
  switch (role) {
    case roles.sheriff:
      return "red lighten-3 grey-text text-darken-4";
    case roles.citizen:
      return "red lighten-5 grey-text text-darken-4";
    case roles.mafia:
      return "grey lighten-2 grey-text text-darken-4";
    case roles.don:
      return "grey grey-text text-lighten-5";
    default:
      return "";
  }
}

class App extends React.Component {
  stats = {
    games: {
      byDays: [],
    },
    players: {
      list: {},
    },
    meetings: {
      byDays: [],
      log: {},
      gamesPerMeetingMin: 99,
      gamesPerMeetingMax: 0,
    },
  };

  state = {
    meetingInfo: '',
    plrInfo: '',
  }

  constructor(props) {
    super(props);
    const games = this.stats.games;
    const meetings = this.stats.meetings;
    const players = this.stats.players;

    games.count = log.length;
    log.forEach(log => {
      if (log.win === roles.mafia) {
        games.mafiaWin = _.add(games.mafiaWin, 1);
        games.mafiaWinRate = getRate(games.count, games.mafiaWin);
      } else {
        games.cityWin = _.add(games.cityWin, 1);
        games.cityWinRate = getRate(games.count, games.cityWin);
      }
      const date = moment(log.date, dateFormat);
      games.byDays[date.format('d')] = _.add(games.byDays[date.format('d')], 1);
      if (!_.has(meetings.log, date.format('X'))) {
        _.set(meetings.log, date.format('X'), []);
      }
      meetings.log[date.format('X')].push(log);
      meetings.last = date.fromNow();

      log.players.forEach(plr => {
        if (!players.list[plr.name]) {
          players.list[plr.name] = {
            byRoles: {},
          }
        }
        const p = players.list[plr.name];
        p.games = _.add(p.games, 1);
        if (plr.win) {
          p.win = _.add(p.win, 1);
        } else {
          p.lose = _.add(p.lose, 1);
        }
        p.byRoles[plr.role] = _.add(p.byRoles[plr.role], 1);
        p.winRate = getRate(p.games, p.win);
        p.loseRate = getRate(p.games, p.lose);
        p.lastGame = date.fromNow();
      })
    });

    _.forEach(meetings.log, (log, date) => {
      meetings.gamesPerMeetingMax = Math.max(meetings.gamesPerMeetingMax, log.length);
      meetings.gamesPerMeetingMin = Math.min(meetings.gamesPerMeetingMin, log.length);
      const day = moment(date, 'X').format('d');
      meetings.byDays[day] = _.add(meetings.byDays[day], 1);
    });

    const plrStats = _.reduce(players.list, (result, p, name) => {
      const r = {...result};
      if (p.winRate > r.mostWinRate.value) { // TODO: несколько человек
        r.mostWinRate.name = name;
        r.mostWinRate.value = p.winRate;
      }
      if (p.winRate < r.mostLoseRate.value) {
        r.mostLoseRate.name = name;
        r.mostLoseRate.value = p.winRate;
      }
      if (p.games > r.mostActive.value) {
        r.mostActive.name = name;
        r.mostActive.value = p.games;
      }
      if (p.games < r.lessActive.value) {
        r.lessActive.name = name;
        r.lessActive.value = p.games;
      }
      if (p.byRoles[roles.mafia] > r.mostMafia.value) {
        r.mostMafia.name = name;
        r.mostMafia.value = p.byRoles[roles.mafia];
      }
      if (p.byRoles[roles.don] > r.mostDon.value) {
        r.mostDon.name = name;
        r.mostDon.value = p.byRoles[roles.don];
      }
      if (p.byRoles[roles.citizen] > r.mostCitizen.value) {
        r.mostCitizen.name = name;
        r.mostCitizen.value = p.byRoles[roles.citizen];
      }
      if (p.byRoles[roles.sheriff] > r.mostSheriff.value) {
        r.mostSheriff.name = name;
        r.mostSheriff.value = p.byRoles[roles.sheriff];
      }
      return r;
    }, {
      mostActive: {name: '', value: 0},
      lessActive: {name: '', value: 9999999},
      mostWinRate: {name: '', value: 0},
      mostLoseRate: {name: '', value: 200},
      mostMafia: {name: '', value: 0},
      mostDon: {name: '', value: 0},
      mostCitizen: {name: '', value: 0},
      mostSheriff: {name: '', value: 0},
    });

    _.merge(players, plrStats);
  }

  onNameClick = name => () => {
    this.setState({
      plrInfo: name
    });
  }

  onMeetingClick = date => () => {
    this.setState({
      meetingInfo: date
    });
  }

  getArchiveBlock = () => {
    const {meetings} = this.stats;
    const chunks = _.chunk(Object.keys(meetings.log).reverse(), Math.floor(Object.keys(meetings.log).length / 2));
    return (
      <div className="card">
        {this.getMeetingInfo()}
        <div className="card-content">
          <span className="card-title">Архив</span>
          <div className="row">
            {chunks.map((data, index) => (
              <div className="col s12 xl6" key={`col-${index}`}>
                <div className="collection">
                  {data.map(date => (
                    <div className="collection-item grey-text text-darken-4 activator" key={date}
                       onClick={this.onMeetingClick(date)}>
                      <span className="left activator">{moment(date, 'X').format('D MMMM YYYY')}</span>
                      <small className="right activator">{moment(date, 'X').fromNow()}</small>
                      <div style={{clear: "both"}}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  getPlayersListBlock = () => {
    const {players} = this.stats;
    const chunks = _.chunk(Object.keys(players.list).sort(), Math.floor(Object.keys(players.list).length / 3));
    return (
      <div className="card">
        {this.getPlrInfo()}
        <div className="card-content">
          <span className="card-title">Список игроков</span>
          <div className="row">
            {chunks.map((data, index) => (
              <div className="col s12 xl4" key={`col-${index}`}>
                <div className="collection">
                  {data.map(plr => (
                    <div className="collection-item grey-text text-darken-4 activator" key={plr}
                       onClick={this.onNameClick(plr)}>
                      <span className="left activator">{plr}</span>
                      <small className="right activator">{players.list[plr].lastGame}</small>
                      <div style={{clear: "both"}}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  getGamesBlock = () => {
    const {games} = this.stats;

    return (
      <div className="card">
        <div className="card-content">
          <span className="card-title">Игры</span>
          <table>
            <tbody>
            <tr>
              <td>Всего</td>
              <td className="right-align">{games.count}</td>
            </tr>
            <tr>
              <td>Побед мафии</td>
              <td className="right-align">{games.mafiaWin} ({games.mafiaWinRate}%)</td>
            </tr>
            <tr>
              <td>Побед мирных</td>
              <td className="right-align">{games.cityWin} ({games.cityWinRate}%)</td>
            </tr>
            <tr>
              <td colSpan="2">
                <table className="centered striped">
                  <tbody>
                  <tr>
                    <td>ПН</td>
                    <td>ВТ</td>
                    <td>СР</td>
                    <td>ЧТ</td>
                    <td>ПТ</td>
                    <td>СБ</td>
                    <td>ВС</td>
                  </tr>
                  <tr>
                    {[1, 2, 3, 4, 5, 6, 0].map(index => <td
                      key={`game-${index}`}>{_.get(games.byDays, `[${index}]`, '-')}</td>)}
                  </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  getMeetingsBlock = () => {
    const {meetings} = this.stats;

    return (
      <div className="card">
        <div className="card-content">
          <span className="card-title">Встречи</span>
          <table>
            <tbody>
            <tr>
              <td>Всего</td>
              <td className="right-align">{Object.keys(meetings).length}</td>
            </tr>
            <tr>
              <td>Последняя</td>
              <td className="right-align">{meetings.last}</td>
            </tr>
            <tr>
              <td>Игр за вечер (мин/макс)</td>
              <td className="right-align">{meetings.gamesPerMeetingMin} / {meetings.gamesPerMeetingMax}</td>
            </tr>
            <tr>
              <td colSpan="2">
                <table className="centered striped">
                  <tbody>
                  <tr>
                    <td>ПН</td>
                    <td>ВТ</td>
                    <td>СР</td>
                    <td>ЧТ</td>
                    <td>ПТ</td>
                    <td>СБ</td>
                    <td>ВС</td>
                  </tr>
                  <tr>
                    {[1, 2, 3, 4, 5, 6, 0].map(index => <td
                      key={`meeting-${index}`}>{_.get(meetings.byDays, `[${index}]`, '-')}</td>)}
                  </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  getPlayersBlock = () => {
    const {players} = this.stats;

    return (
      <div className="card">
        <div className="card-content">
          <span className="card-title">Игроки</span>
          <table>
            <tbody>
            <tr>
              <td>Всего</td>
              <td className="right-align">{Object.keys(players.list).length}</td>
            </tr>
            <tr>
              <td>Наиболее активный</td>
              <td className="right-align">{players.mostActive.name} ({players.mostActive.value} игр)</td>
            </tr>
            <tr>
              <td>Наимение активный</td>
              <td className="right-align">{players.lessActive.name} ({players.lessActive.value} игр)</td>
            </tr>
            <tr>
              <td>Наивысший винрейт</td>
              <td className="right-align">{players.mostWinRate.name} ({players.mostWinRate.value}%)</td>
            </tr>
            <tr>
              <td>Наинизший винрейт</td>
              <td className="right-align">{players.mostLoseRate.name} ({players.mostLoseRate.value}%)</td>
            </tr>
            <tr>
              <td>Главный мирный</td>
              <td className="right-align">{players.mostCitizen.name} ({players.mostCitizen.value} игр)</td>
            </tr>
            <tr>
              <td>Главный шериф</td>
              <td className="right-align">{players.mostSheriff.name} ({players.mostSheriff.value} игр)</td>
            </tr>
            <tr>
              <td>Главный мафиози</td>
              <td className="right-align">{players.mostMafia.name} ({players.mostMafia.value} игр)</td>
            </tr>
            <tr>
              <td>Главный дон</td>
              <td className="right-align">{players.mostDon.name} ({players.mostDon.value} игр)</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  getMeetingInfo = () => {
    const {meetingInfo: date} = this.state;
    if (!date) {
      return null;
    }
    const data = this.stats.meetings.log[date];
    return (
      <div className="card-reveal">
          <span className="card-title grey-text text-darken-4">Встреча {moment(date, 'X').format(dateFormat)}<i
            className="material-icons right">close</i></span>
        <div className="row">
          {data.map((game, index) => (
            <div className="col s12 xl4" key={`game-${index}`}>
              <div className="collection">
                <div
                  className="collection-item grey-text text-darken-4">Игра {index + 1} (Победа {game.win === roles.mafia ? 'мафии' : 'мирных'})
                </div>
                {(_.orderBy(game.players, 'name')).map(plr => (
                  <div className={`collection-item ${getRoleBackground(plr.role)}`} key={`plr-${plr.name}`}>
                    <span className="left">{plr.name}</span>
                    <small className="right">{translateRole(plr.role)}</small>
                    <div style={{clear: "both"}}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  getPlrInfo = () => {
    const {plrInfo: name} = this.state;
    if (!name) {
      return null;
    }
    const data = this.stats.players.list[name];
    return (
      <div className="card-reveal">
          <span className="card-title grey-text text-darken-4">Игрок {name}<i
            className="material-icons right">close</i></span>
        <div className="row">
          <table>
            <tbody>
            <tr><td>Последняя активность</td><td className="right-align">{data.lastGame}</td></tr>
            <tr><td>Всего игр</td><td className="right-align">{data.games}</td></tr>
            <tr><td>Побед</td><td className="right-align">{data.win} ({data.winRate}%)</td></tr>
            <tr><td>Поражений</td><td className="right-align">{data.lose} ({data.loseRate}%)</td></tr>
            </tbody>
          </table>
          <table>
            <thead>
              <tr><th>Игр по ролям</th></tr>
            </thead>
            <tbody>
            {_.map(data.byRoles, (value, role) => (
              <tr key={role}>
                <td>{translateRole(role)}</td>
                <td className="right-align">{value} ({getRate(data.games, value)}%)</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  render() {
    return (
      <React.Fragment>
        <nav>
          <div className="container">
            <div className="nav-wrapper">
              <span className="brand-logo">Мафиозная статистика</span>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="row">
            <div className="col s12 l6 xl4">
              {this.getMeetingsBlock()}
              {this.getGamesBlock()}
              {this.getPlayersBlock()}
            </div>
            <div className="col s12 l6 xl8">
              {this.getArchiveBlock()}
              {this.getPlayersListBlock()}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default App;
