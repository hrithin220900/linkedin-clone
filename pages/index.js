import Head from 'next/head'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { getSession, useSession } from "next-auth/react";
import { useRouter } from 'next/router';
import Feed from '../components/Feed';
import { modalState, modalTypeState } from '../atoms/modalAtom';
import { useRecoilState } from 'recoil';
import { AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';
import { connectToDatabase } from '../util/mongodb';
import Widgets from '../components/Widgets';

export default function Home({posts, articles}) {

  const [modalOpen, setModalOpen] = useRecoilState(modalState);
  const [modalType, setModalType] = useRecoilState(modalTypeState);


  const router = useRouter()
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/home")
    },
  })

  return (
    <div className="bg-[#F3F3F3] dark:bg-black dark:text-white h-screen overflow-y-scroll md:space-y-6"> 
      <Head>
        <title>LinkedIn</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex justify-center gap-x-5 px-4 sm:px-12">
        <div className="flex flex-col md:flex-row gap-5 ">
          <Sidebar />
          <Feed posts={posts} />
        </div>
        <Widgets articles={articles} />
        <AnimatePresence>
          {modalOpen && (
            <Modal handleClose={() => setModalOpen(false)} type={modalType} />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export async function getServerSideProps(context) {
  const session = await getSession(context)
  if(!session){
    return{
      redirect: {
        permanent: false,
        destination: "/home"
      }
    }
  }

  const {db} = await connectToDatabase()
  const posts = await db.collection("posts").find().sort({timestamp: -1}).toArray();

  const results = await fetch(`https://newsapi.org/v2/top-headlines?country=in&apiKey=${process.env.NEWS_API_KEY}`).then((res) => res.json());

  return{
    props: {
      session,
      articles: results.articles, 
      posts: posts.map((post) => (
        {
          _id: post._id.toString(),
          input: post.input,
          photoUrl: post.photoUrl,
          username: post.username,
          email: post.email,
          userImg: post.userImg,
          createdAt: post.createdAt
        }
      ))
    }
  }
}
