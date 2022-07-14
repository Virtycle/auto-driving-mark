import { Config } from './worker-creater';

export default (input: Config) => {
    // no import to use
    self.onmessage = () => {
        console.log(input);
    };
};
