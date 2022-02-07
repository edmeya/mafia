export const roles = {
  citizen: 'citizen',
  mafia: 'mafia',
  don: 'don',
  sheriff: 'sheriff',
  city: 'city',
};

export const isMafia = role => [roles.don, roles.mafia].includes(role);

export const translateRole = role => {
  switch (role) {
    case roles.mafia: return 'Мафия';
    case roles.citizen: return 'Мирный';
    case roles.don: return 'Дон';
    case roles.sheriff: return 'Шериф';
    case roles.city: return 'Город';
    default: return 'Самозванец';
  }
}