import { program } from 'commander';
import { parse } from 'csv-parse';
import { io } from 'socket.io-client';
import * as readline from 'readline';

program
    .requiredOption('-s, --server <url>', 'URL of the Uptime Kuma server')
    .option('-u, --username <username>', 'Username of the Uptime Kuma server')
    .option('-p, --password <password>', 'Password of the Uptime Kuma server')
    .option('-v, --verbose', 'Output Socket.IO debug messages')
    .option('-d, --dry-run', 'Do not send any data to the server')
    .version('0.1.0')
    .parse(process.argv);

const options = program.opts();

if (options.verbose) {
    process.env.DEBUG = 'socket.io-client:*';
}

const monitor = {
    accepted_statuscodes: ["200-299","301","302"],
    authMethod: null,
    dns_resolve_server: "1.1.1.1",
    dns_resolve_type: "A",
    docker_container: "",
    docker_host: null,
    expiryNotification: true,
    ignoreTls: true,
    interval: 60,
    maxredirects: 0,
    maxretries: 5,
    method: "GET",
    mqttPassword: "",
    mqttSuccessMessage: "",
    mqttTopic: "",
    mqttUsername: "",
    notificationIDList: {},
    proxyId: null,
    resendInterval: 360,
    retryInterval: 60,
    upsideDown: false,
}

async function addMonitorsSequentially() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });

    let count = 0;

    const addMonitorPromise = (record: any) => {
        return new Promise<void>((resolve) => {
            if (options.dryRun !== true) {
                // Add monitor
                socket.emit('add', { ...monitor, type: 'http', name: record[0], url: record[1] }, () => {
                    console.log('Added monitor', ++count, record[0]);
                    resolve();
                });
            } else {
                console.log('[Dry run] Added monitor', ++count, record[0]);
                resolve();
            }
        });
    };

    for await (const line of rl) {
        await addMonitorPromise(line.split(','));
    }

    console.log('All monitors added');
    process.exit(0);
}

async function addMonitorsInParallel() {
    let count = 0;

    process.stdin
        .pipe(parse())
        .on('data', (record: any) => {
            if (options.dryRun !== true) {
                // add monitor
                socket.emit('add', { ...monitor, type: 'http', name: record[0], url: record[1]});
                console.log('Added monitor', ++count, record[0]);
            } else {
                console.log('[Dry run] Added monitor', ++count, record[0]);
            }
        })
        .on('end', () => {
            console.log('All monitors added');
            process.exit(0);
        });
}

const socket = io(options.server, {'transports': ['websocket']});
const data: any[] = [];

console.log('Connecting to server', options.server);

socket.on('connect', async () => {
    console.log('Connected to Uptime Kuma');

    // login
    socket.emit('login', {username: options.username, password: options.password, token: ''}, (res:any) => {
        if (res.ok) {
            console.log('Logged in successfully');

            addMonitorsSequentially().catch((error) => {
                console.error('Error:', error);
                process.exit(1);
            });
        } else {
            console.log('Login failed: ' + res.msg);
        }
    });
});
