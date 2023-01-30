import { program } from 'commander';
import { parse } from 'csv-parse';
import { io } from 'socket.io-client';

program
    .requiredOption('-s, --server <url>', 'URL of the Uptime Kuma server')
    .option('-u, --username <username>', 'Username of the Uptime Kuma server')
    .option('-p, --password <password>', 'Password of the Uptime Kuma server')
    .version('0.1.0')
    .parse(process.argv);

const options = program.opts();

const monitor = {
    accepted_statuscodes: ["200-299"],
    authMethod: null,
    dns_resolve_server: "1.1.1.1",
    dns_resolve_type: "A",
    docker_container: "",
    docker_host: null,
    expiryNotification: true,
    ignoreTls: false,
    interval: 60,
    maxredirects: 10,
    maxretries: 0,
    method: "GET",
    mqttPassword: "",
    mqttSuccessMessage: "",
    mqttTopic: "",
    mqttUsername: "",
    notificationIDList: {},
    proxyId: null,
    resendInterval: 0,
    retryInterval: 60,
    type: "http",
    upsideDown: false,
}

const socket = io("https://" + options.server, {'transports': ['websocket']});
const data: any[] = [];

socket.on('connect', async () => {
    console.log('Connected to Uptime Kuma');

    // login
    socket.emit('login', {username: options.username, password: options.password, token: ''}, (res:any) => {
        if (res.ok) {
            console.log('Logged in successfully');
            process.stdin
                .pipe(parse())
                .on('data', (record: any) => {
                    // add monitor
                    socket.emit('add', { ...monitor, type: 'http', name: record[0], url: record[1]});
                })
                .on('end', () => {
                    console.log('All monitors added');
                    process.exit(0);
                });
        } else {
            console.log('Login failed: ' + res.msg);
        }
    });
});
