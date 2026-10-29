import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
# New, correct way
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

PDF_PATH = "hotel_policies.pdf"
INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME")
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")


def get_retriever():
    """Returns a Pinecone retriever for the agent to use."""
    pc = Pinecone(api_key=PINECONE_API_KEY)
    existing_indexes = [idx["name"] for idx in pc.list_indexes()]

    if INDEX_NAME not in existing_indexes:
        pc.create_index(
            name=INDEX_NAME,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        loader = PyPDFLoader(PDF_PATH)
        docs = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50).split_documents(loader.load())
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vector_store = PineconeVectorStore.from_documents(docs, embeddings, index_name=INDEX_NAME)
    else:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vector_store = PineconeVectorStore(index_name=INDEX_NAME, embedding=embeddings)

    return vector_store.as_retriever(search_kwargs={"k": 3})