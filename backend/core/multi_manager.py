from core.pipeline import FocusPipeline
from core.source import CSVReplaySource

class MultiUserManager:
    def __init__(self, files: list[str]):
        self.users = {}

        for i, file in enumerate(files):
            user_id = f"user_{i+1}"
            source = CSVReplaySource(filepath=file, realtime=True)

            pipeline = FocusPipeline(source)
            generator = pipeline.run()

            self.users[user_id] = {
                "pipeline": pipeline,
                "generator": generator
            }

    def run_all(self):
        results = {}

        for uid, obj in self.users.items():
            try:
                result = next(obj["generator"])
                if result:
                    results[uid] = result
            except StopIteration:
                # restart stream (looping behavior)
                obj["generator"] = obj["pipeline"].run()

        return results