import {WebContainer} from "@webcontainer/api";

const form = document.querySelector('#editor');
const output = document.querySelector('#output');

window.addEventListener('load', async () => {
    console.log('loading..');

    const container = await WebContainer.boot();
    
    console.log('booting..');

    container.on('server-ready', async (port, url) => {
        console.log(url, port);
        document.querySelector('#dev-url')?.setAttribute('src', `${url}`)
    })

    container.fs.writeFile('index.html', `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        #interface {
            display: grid;
            grid-template-columns: 300px 1fr;
        }
        #preview {
            border: 1px solid black;
        }
    </style>
</head>
<body>
    <section id="interface">
        <form id="editor">
            <input type="text" id="command" name="command" />
            <button type="submit">Send</button>
        </form>
        <div id="preview">
            <iframe id="dev-url" src="" frameborder="0"></iframe>
        </div>

    </section>

    <pre id="output"></pre>

    <script type="module" src="index.ts"></script>
</body>
</html>
    `, {encoding: 'utf-8'});
    
    container.fs.writeFile('index.ts', `console.log("Hello");`);

    async function run(command: string, args: string[]){
    
        const response = await container.spawn(command, args);
    
        if((await response.exit)) {
            throw new Error('something went wrong!');
        }
    
        response.output.pipeTo(new WritableStream({
            write: (chunk) => {
                output!.textContent += chunk + '\n';
            }
        }))
    }

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const data = new FormData(event.target as HTMLFormElement);

        const text = data.get('command') as string;

        const [command, ...args] = text.split(' ');

        await run(command, args);
    })

    // await run('echo', ['<script type="module" src="index.ts"></script>', '>', 'index.html']);
    await run('echo', ['console.log("hello!")', '>', 'index.ts']);
})