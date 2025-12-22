// Used for the 3D Intro UI (Block Style)
export const ASCII_TITLE = `
 ███▄ ▄███▓▓█████  ██████  ▒█████  ▓█████  ██▓      █████▒▓██   ██▓
▓██▒▀█▀ ██▒▓█   ▀▒██    ▒ ▒██▒  ██▒▓█   ▀ ▓██▒    ▒▓█   ▒  ▒██  ██▒
▓██    ▓██░▒███  ░ ▓██▄   ▒██░  ██▒▒███   ▒██░    ▒▓███ ░   ▒██ ██░
▒██    ▒██ ▒▓█  ▄  ▒   ██▒▒██   ██░▒▓█  ▄ ▒██░    ░▓█▒  ░   ░ ▐██░░
▒██▒   ░██▒░▒████▒██████▒▒░ ████▓▒░░▒████▒░██████▒░▒█░      ░ ██▒░░
░ ▒░   ░  ░░░ ▒░ ░ ▒░▒  ░ ░ ▒░▒░▒░ ░░ ▒░ ░░ ▒░▒  ░ ▒ ░       ██▒▒▒
░  ░      ░ ░ ░  ░ ░ ▒  ░   ░ ▒ ▒░  ░ ░  ░░ ░ ▒  ░ ░       ▓██ ░▒░ 
░      ░      ░    ░ ░    ░ ░ ░ ▒     ░     ░ ░    ░ ░     ▒ ▒ ░░  
       ░      ░  ░   ░  ░     ░ ░     ░  ░    ░  ░         ░ ░     
`;

// Stylized Header for Console
export const ASCII_CONSOLE = `
   __  __  ____  ____  ____  ____  __    ____  _  _ 
  (  \\/  )(  __)/ ___)/  _ \\(  __)(  )  (  __)( \\/ )
   )    (  ) _) \\___ \\  (_) )) _) / (_/\\ ) _)  \\  / 
  (_/\\/\\_)(____)(____/\\____/(____)\\____/(_)    (__) 
`;

const BASE_STYLE = 'font-family: "Courier New", monospace; font-weight: bold; font-size: 10px; line-height: 12px;';

export const CONSOLE_STYLES = {
  GREEN:  `${BASE_STYLE} color: #78F654; background: #050505;`,
  PURPLE: `${BASE_STYLE} color: #9E4EA5; background: #050505;`,
  CYAN:   `${BASE_STYLE} color: #FFCCFF; background: #050505;`, // Updated to #FFCCFF
  TAG:    `font-family: monospace; font-size: 9px; background: #9E4EA5; color: #000; padding: 2px 4px; border-radius: 2px; font-weight: bold;`,
  STATUS: `font-family: monospace; font-size: 9px; background: #78F654; color: #000; padding: 2px 4px; border-radius: 2px; font-weight: bold;`
};
