import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../components/Layout';
import { getValidSessionByToken } from '../util/database';
import { LoginResponse } from './api/login';

type Props = {
  refreshUsername: () => void;
  username?: string;
};

export default function Login(props: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  return (
    <Layout username={props.username}>
      <Head>
        <title>Login</title>
      </Head>

      <h1>Login</h1>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          // Send the username and password to the API
          // for verification
          const response = await fetch(`/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username,
              password: password,
            }),
          });

          const json = (await response.json()) as LoginResponse;

          if ('errors' in json) {
            setError(json.errors[0].message);
            return;
          }

          props.refreshUsername();

          // Navigate to the user's page when
          // they have been successfully created
          router.push(`/profiles/${json.user.username}`);
        }}
      >
        <div>
          <label>
            username:
            <input
              data-cy="users-management-create-username"
              value={username}
              onChange={(event) => {
                setUsername(event.currentTarget.value);
              }}
            />
          </label>
        </div>

        <div>
          <label>
            password:
            <input
              data-cy="users-management-create-password"
              value={password}
              type="password"
              onChange={(event) => {
                setPassword(event.currentTarget.value);
              }}
            />
          </label>
        </div>

        <button>Login</button>

        <div style={{ color: 'red' }}>{error}</div>
      </form>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Redirect from HTTP to HTTPS on Heroku
  if (
    context.req.headers.host &&
    context.req.headers['x-forwarded-proto'] &&
    context.req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return {
      redirect: {
        destination: `https://${context.req.headers.host}/login`,
        permanent: true,
      },
    };
  }

  const sessionToken = context.req.cookies.sessionToken;

  const session = await getValidSessionByToken(sessionToken);

  if (session) {
    // Redirect the user when they have a session
    // token by returning an object with the `redirect` prop
    // https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering
    return {
      redirect: {
        destination: `/users/management/${session.userId}/read`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
