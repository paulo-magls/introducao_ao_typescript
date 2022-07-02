let apiKey = '3f301be7381a03ad8d352314dcc3ec1d';
let requestToken: string;
let username: string;
let password: string;
let sessionId: string;
let listId = '7101979';

const loginButton = document.getElementById('login-button') as HTMLButtonElement;
const loginInput = document.getElementById('login') as HTMLInputElement;
const passwordInput = document.getElementById('senha') as HTMLInputElement;
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const searchInput = document.getElementById('search') as HTMLInputElement;
const searchButton = document.getElementById('search-button') as HTMLButtonElement;
const searchContainer = document.getElementById('search-container') as HTMLButtonElement;

interface Movie {
    original_title: string,
}

loginButton.addEventListener('click', async () => {
    await criarRequestToken();
    await logar();
    await criarSessao();
})

searchButton.addEventListener('click', async () => {
    let lista = document.getElementById("lista");
    if (lista) {
        lista.outerHTML = "";
    }
    let query = searchInput.value;
    let listaDeFilmes = await procurarFilme(query) ?? [];
    let ul = document.createElement('ul');
    ul.id = "lista";
    for (const item of listaDeFilmes) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(item.original_title))
        ul.appendChild(li)
    }
    console.log(listaDeFilmes);
    searchContainer.appendChild(ul);
})

function preencherSenha() {
    password = passwordInput.value;
    validateLoginButton();
}

function preencherLogin() {
    username = loginInput.value;
    validateLoginButton();
}

function preencherApi() {
    apiKey = apiKeyInput.value;
    validateLoginButton();
}

function validateLoginButton() {
    if (password && username && apiKey) {
        loginButton.disabled = false;
    } else {
        loginButton.disabled = true;
    }
}

interface LoginBody {
    username: string,
    password: string,
    request_token: string,
}

interface MovieList {
    name: string,
    description: string,
    language: string,
}

interface HttpClientParams<B> {
    url: string,
    method: string,
    body?: B,
}

class HttpClient {
    static get<B, R>({ url, method, body }: HttpClientParams<B>): Promise<R> {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open(method, url, true);

            request.onload = () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve(JSON.parse(request.responseText));
                } else {
                    reject({
                        status: request.status,
                        statusText: request.statusText
                    })
                }
            }
            request.onerror = () => {
                reject({
                    status: request.status,
                    statusText: request.statusText
                })
            }

            if (body) {
                request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                const bodyJson = JSON.stringify(body);
                request.send(bodyJson);
            } else {
                request.send();
            }
        })
    }
}

async function procurarFilme(query: string): Promise<Movie[] | null> {
    query = encodeURI(query)
    console.log(query)
    let result: { results: Movie[] } = await HttpClient.get({
        url: `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
        method: "GET"
    })
    return result?.results ?? null;
}

async function adicionarFilme(filmeId: string) {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=en-US`,
        method: "GET"
    })
    console.log(result);
}

async function criarRequestToken() {
    let result: { request_token: string } = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${apiKey}`,
        method: "GET"
    })
    requestToken = result.request_token
}

async function logar() {
    await HttpClient.get<LoginBody, {}>({
        url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${apiKey}`,
        method: "POST",
        body: {
            username: `${username}`,
            password: `${password}`,
            request_token: `${requestToken}`
        }
    })
}

async function criarSessao() {
    let result: { session_id: string } = await HttpClient.get({
        url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${apiKey}&request_token=${requestToken}`,
        method: "GET"
    })
    sessionId = result.session_id;
}

async function criarLista(nomeDaLista: string, descricao: string) {
    let result = await HttpClient.get<MovieList, {}>({
        url: `https://api.themoviedb.org/3/list?api_key=${apiKey}&session_id=${sessionId}`,
        method: "POST",
        body: {
            name: nomeDaLista,
            description: descricao,
            language: "pt-br"
        }
    });
    console.log(result);
}

async function adicionarFilmeNaLista(filmeId: string, listaId: string) {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${apiKey}&session_id=${sessionId}`,
        method: "POST",
        body: {
            media_id: filmeId
        }
    })
    console.log(result);
}

async function pegarLista() {
    let result = await HttpClient.get({
        url: `https://api.themoviedb.org/3/list/${listId}?api_key=${apiKey}`,
        method: "GET"
    })
    console.log(result);
}