//local strategy from passport
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt') 

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email)
    //kola om användare finns
    if (user == null) {
      return done(null, false, { message: 'Kunde inte hitta email 👾' })
    }
    // kola om lösenord matchas
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Fel lösenord' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id)) //spara i session
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id)) 
  })
}

module.exports = initialize