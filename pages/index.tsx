import { useMemo } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import axios from "axios";
import * as lookup from "country-code-lookup";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

const lookupStatus = (status) => {
  switch (status) {
    case 0:
      return "No measures";
    case 1:
      return "Recommend not leaving house";
    case 2:
      return "Require not leaving house with exceptions for daily exercise, grocery shopping, and 'essential' trips";
    case 3:
      return "Require not leaving house with minimal exceptions (eg allowed to leave once a week, or only one person can leave at a time, etc)";
    case "null":
      return "No data";
  }
};

const calcDays = (ts) => {
  return differenceInCalendarDays(new Date(), new Date(ts));
};

export default function Home({
  country,
  allCountries,
  countryData,
  latest,
  days,
}) {
  const current = countryData.find(
    (d) => d.code.toLowerCase() === country.toLowerCase()
  );

  return (
    <div className="container">
      <Head>
        {current ? (
          <title>How long has {country} been stuck inside?</title>
        ) : (
          <title>How long have you been stuck inside?</title>
        )}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        {current ? (
          <>
            <h1 className="title">
              <span style={{ textDecoration: "underline" }}>
                {current.name}
              </span>{" "}
              has been <strong>stuck insi.de</strong> for{" "}
              {calcDays(current.first.StartDate)} days{" "}
            </h1>
            <h2>Status: {lookupStatus(current.latest.PolicyValue)}</h2>
            <p>{current.latest.InitialNote}</p>
          </>
        ) : (
          <h1 className="title">
            How long have you been <strong>Stuck Insi.de</strong>?
          </h1>
        )}

        <p className="description"></p>

        <div className="grid">
          {countryData.map((country) => {
            return (
              <a
                key={country.code}
                href={`https://${country.code}.stuckinsi.de`}
                className="card"
              >
                <h3>{country.name}</h3>
                <h4>Current status:</h4>
                <p>{lookupStatus(country.latest.PolicyValue)}</p>
                <h4>Days locked down: {calcDays(country.first.StartDate)}</h4>
              </a>
            );
          })}
        </div>
      </main>
      <footer>
        All data from the{" "}
        <a href="https://github.com/OxCGRT/covid-policy-tracker">
          Oxford COVID-19 policy tracker
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

Home.defaultProps = {
  countryData: [],
  latest: [],
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const [country] = context.req.headers.host.split(".");
  const { data } = await axios(
    "https://app.workbenchdata.com/public/moduledata/live/353395.json"
  );

  const { iso3: codeCurrent } = lookup.byInternet(country) || {};
  const allCountries: ICountry[] = data
    .map((d) => {
      const codes = lookup.byIso(d.CountryCode);
      if (!codes || !codes.internet) {
        console.error(d.CountryCode);
        return;
      }
      const Code = codes.internet;
      return {
        ...d,
        StartDate: new String(d.StartDate).replace(
          /(\d{4})(\d{2})(\d{2})/,
          "$1-$2-$3"
        ),
        EndDate: new String(d.EndDate).replace(
          /(\d{4})(\d{2})(\d{2})/,
          "$1-$2-$3"
        ),
        Code,
      };
    })
    .filter((i) => i);

  const countryData = [
    ...new Map(
      allCountries.map((d) => {
        const [first] = allCountries
          .filter((e) => d.CountryCode === e.CountryCode)
          .sort(
            (a, b) =>
              new Date(a.StartDate).valueOf() - new Date(b.StartDate).valueOf()
          );

        return [
          d.Code,
          {
            code: d.Code,
            name: d.CountryName,
            latest: allCountries.find((e) => e.EndDate === "null"),
            first,
          },
        ];
      })
    ).values(),
  ];
  return {
    props: {
      country,
      countryData,
      current: codeCurrent
        ? countryData.filter((d) => d.code === codeCurrent)
        : null,
    },
  };
};

interface ICountry {
  CountryName: string;
  CountryCode: string;
  StartDate: string;
  EndDate: string | null;
  PolicyType: string;
  PolicyValue: number;
  Flag: number;
  InitialNote: string;
  Code: string;
}
